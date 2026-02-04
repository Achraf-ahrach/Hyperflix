import logging
import os
from typing import Optional, Union
from django.http import StreamingHttpResponse, FileResponse
import re, os
import time
import ffmpeg
from .models import MovieFile
from srt_to_vtt import srt_to_vtt
from django.conf import settings
import requests
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures

range_re = re.compile(r"bytes\s*=\s*(\d+)\s*-\s*(\d*)", re.I)


class VideoService:
    def __init__(self):
        self.segment_duration = 10
        self.processed_segments = set()
        self.failed_segments = set()
        self.segment_retry_count = {}
        self.segment_last_attempt = {}
        self.max_retries = 3
        self.retry_cooldown = 30

    def get_video_duration(self, video_path: str) -> Optional[float]:
        """Get video duration using ffprobe."""
        try:
            safe_path = f"file:{video_path}"
            probe = ffmpeg.probe(safe_path)
            return float(probe['format']['duration'])
        except ffmpeg.Error as e:
            logging.error(f"Error getting video duration: {e.stderr.decode()}")
            return None
        except Exception as e:
            logging.error(f"Error getting video duration: {e}")
            return None

    def convert_segment(self, input_path: str, output_dir: str, current_segment: int, video_duration: float) -> bool:
        """Convert a single segment of the video to HLS-compatible .ts format."""
        
        if not os.path.exists(input_path):
            logging.error(f"convert_segment: Input file missing at {input_path}")
            return False

        start_time = current_segment * self.segment_duration
        
        rel_path = os.path.relpath(input_path, output_dir)
        dir_path = os.path.dirname(rel_path)
        file_name = os.path.basename(rel_path)
        base_name = os.path.splitext(file_name)[0]
        
        segment_name = f"{base_name}_segment_{current_segment:03d}.ts"
        
        if dir_path and dir_path != '.':
            segment_path = os.path.join(output_dir, dir_path, segment_name)
            os.makedirs(os.path.dirname(segment_path), exist_ok=True)
        else:
            segment_path = os.path.join(output_dir, segment_name)

        self.segment_last_attempt[current_segment] = time.time()

        try:
            safe_input_path = f"file:{input_path}"

            stream = (
                ffmpeg
                .input(safe_input_path, ss=start_time, t=min(self.segment_duration, video_duration - start_time))
                .output(
                    segment_path,
                    format='mpegts',
                    
                    # VIDEO: Force x264 for browser compatibility
                    vcodec='libx264',
                    preset='ultrafast',  # Fast encoding, larger file size. Use 'veryfast' if buffering occurs.
                    pix_fmt='yuv420p',
                    
                    # AUDIO: Force AAC Stereo (Safe for all browsers)
                    acodec='aac',
                    ac=2,  # Downmix 5.1/7.1 to Stereo to prevent browser audio decoder issues
                    
                    # HLS MAGIC: Shift timestamps so this segment continues where the last left off
                    output_ts_offset=start_time,
                    
                    # LATENCY: Reduce container overhead delay
                    muxdelay=0
                )
                .overwrite_output()
            )
            
            stream.run(capture_stdout=True, capture_stderr=True)

            if os.path.exists(segment_path) and os.path.getsize(segment_path) > 0:
                logging.info(f"✓ Converted segment {current_segment}")
                self.processed_segments.add(current_segment)
                return True
            else:
                logging.error(f"Output file not created for segment {current_segment}")
                return False

        except ffmpeg.Error as e:
            error_msg = e.stderr.decode() if hasattr(e, 'stderr') else str(e)
            logging.error(f"FFmpeg error for segment {current_segment}: {error_msg}")
            self.segment_retry_count[current_segment] = self.segment_retry_count.get(current_segment, 0) + 1
            if self.segment_retry_count[current_segment] >= self.max_retries:
                self.failed_segments.add(current_segment)
            return False
        except Exception as e:
            logging.error(f"Exception during segment {current_segment} conversion: {e}")
            return False
     

# ++++++++++++++++++++++++++++++++++++++++++

class SubtitleService:
    BASE_URL = "https://api.opensubtitles.com/api/v1"

    def __init__(self):
        self.headers = {
            "Api-Key": os.getenv("OPENSUBTITLE_API_KEY", ""),
            "Content-Type": "application/json",
            "User-Agent": "torrent",
        }

    def convert_srt_to_vtt(self, srt_path):
        """
        Converts SRT to VTT, but validates the file first.
        """
        if not os.path.exists(srt_path):
            logging.error(f"SRT file not found: {srt_path}")
            return None

        # 1. CHECK FILE SIZE (The Fix)
        # If file is empty or too small (< 10 bytes), it's garbage.
        if os.path.getsize(srt_path) < 10:
            logging.warning(f"SRT file is empty or corrupted: {srt_path}. Deleting.")
            os.remove(srt_path) # Delete it so we can try downloading again later
            return None

        vtt_path = srt_path.replace('.srt', '.vtt')

        try:
            try:
                with open(srt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                with open(srt_path, 'r', encoding='latin-1') as f:
                    content = f.read()
            import re
            content = "WEBVTT\n\n" + re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})', r'\1.\2', content)

            with open(vtt_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            return vtt_path

        except Exception as e:
            logging.error(f"Error converting SRT to VTT: {e}")
            # Optional: Delete bad file so it doesn't crash next time
            if os.path.exists(srt_path):
                os.remove(srt_path)
            return None

    def fetch_all_subtitles(self, movie: MovieFile) -> list:
        """
        1. Get ALL metadata.
        2. Filter duplicates (keep only the highest rated per language).
        3. Download only the unique files.
        """
        subtitles_dir = os.path.join(settings.MEDIA_ROOT, 'downloads', 'subtitles', str(movie.id))
        os.makedirs(subtitles_dir, exist_ok=True)

        # Lock to prevent parallel fetch triggers
        lock_file = os.path.join(subtitles_dir, "download.lock")
        if os.path.exists(lock_file):
            return self._scan_local_subtitles(subtitles_dir, movie.id)

        with open(lock_file, 'w') as f: f.write("locked")

        try:
            # 1. Fetch Metadata (Metadata is small/fast, so we get everything)
            logging.info(f"Fetching subtitle list for {movie.imdb_id}...")
            response = requests.get(
                f"{self.BASE_URL}/subtitles",
                headers=self.headers,
                params={
                    "imdb_id": movie.imdb_id,
                    "order_by": "ratings" # IMPORTANT: Best subtitles come first
                },
                timeout=10
            )
            response.raise_for_status()
            api_data = response.json()

            # 2. DEDUPLICATION LOGIC
            # We use a dictionary to keep track of languages we have already selected.
            tasks_to_download = {} 
            available_subtitles = []

            for item in api_data.get('data', []):
                attributes = item.get('attributes', {})
                lang_code = attributes.get('language')
                
                # If we have already selected a file for this language, SKIP IT.
                # Because we sorted by 'ratings', the first one we see is the best one.
                if lang_code in tasks_to_download:
                    continue

                # Check if file exists locally
                local_filename = f"{lang_code}.vtt"
                local_path = os.path.join(subtitles_dir, local_filename)

                if os.path.exists(local_path):
                    # It exists locally, so we mark it as 'done' and add to results
                    tasks_to_download[lang_code] = "EXISTS" 
                    available_subtitles.append({
                        'language': lang_code,
                        'label': attributes.get('language_name'),
                        'src': os.path.join(settings.MEDIA_URL, 'downloads', 'subtitles', str(movie.id), local_filename)
                    })
                    continue

                # If not local and not in tasks, Queue it for download
                files = attributes.get('files', [])
                if files:
                    tasks_to_download[lang_code] = {
                        'file_id': files[0]['file_id'],
                        'lang_code': lang_code,
                        'lang_name': attributes.get('language_name'),
                        'subtitles_dir': subtitles_dir,
                        'movie_id': movie.id
                    }

            # 3. Execute Downloads (Only for the unique missing items)
            # This list is now much smaller (e.g., 5 items instead of 50)
            clean_tasks = [t for t in tasks_to_download.values() if t != "EXISTS"]
            
            logging.info(f"Downloading {len(clean_tasks)} unique subtitles...")

            # Use ThreadPool to download the unique files in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(self._download_single_subtitle, task) for task in clean_tasks]
                
                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        available_subtitles.append(result)

            return available_subtitles

        except Exception as e:
            logging.error(f"Error in fetch_all_subtitles: {e}")
            return self._scan_local_subtitles(subtitles_dir, movie.id)
        
        finally:
            if os.path.exists(lock_file):
                os.remove(lock_file)
        
    def _download_single_subtitle(self, task):
        """Helper to handle the actual file I/O and conversion for a single file."""
        MAX_RETRIES = 3
        
        try:
            # 1. Get the Download Link
            download_response = requests.post(
                f"{self.BASE_URL}/download",
                headers=self.headers,
                json={"file_id": task['file_id']}
            )
            download_response.raise_for_status()
            link = download_response.json().get('link')
            
            if not link: return None

            # 2. Download the File with Retries
            srt_path = os.path.join(task['subtitles_dir'], f"{task['lang_code']}.srt")
            
            for attempt in range(MAX_RETRIES):
                try:
                    file_response = requests.get(link, stream=True)
                    
                    # Check for HTTP errors (like 503 Service Unavailable)
                    if file_response.status_code in [500, 502, 503, 504]:
                        logging.warning(f"API Error {file_response.status_code}. Retrying {attempt+1}/{MAX_RETRIES}...")
                        time.sleep(2 * (attempt + 1)) # Exponential backoff
                        continue
                    
                    file_response.raise_for_status()
                    
                    # --- CRITICAL CHECK: VALIDATE CONTENT ---
                    # Read the first 1KB to check if it's HTML garbage
                    first_chunk = next(file_response.iter_content(1024), b"")
                    content_start = first_chunk.decode('utf-8', errors='ignore').strip()

                    if "<!DOCTYPE html>" in content_start or "<html" in content_start:
                        logging.error(f"Invalid file received (HTML Error Page) for {task['lang_code']}. Skipping.")
                        return None
                    
                    # If valid, write the first chunk and the rest
                    with open(srt_path, 'wb') as f:
                        f.write(first_chunk)
                        for chunk in file_response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    break # Success, exit retry loop

                except Exception as download_error:
                    logging.error(f"Download attempt failed: {download_error}")
                    if attempt == MAX_RETRIES - 1: return None

            # 3. Convert (Only if SRT exists and is valid)
            if os.path.exists(srt_path):
                # Double check file size (Empty files are also bad)
                if os.path.getsize(srt_path) < 100: 
                    os.remove(srt_path)
                    return None

                vtt_path = self.convert_srt_to_vtt(srt_path)
                
                if vtt_path:
                    return {
                        'language': task['lang_code'],
                        'label': task['lang_name'],
                        'src': os.path.join(settings.MEDIA_URL, 'downloads', 'subtitles', str(task['movie_id']), f"{task['lang_code']}.vtt")
                    }

        except Exception as e:
            logging.error(f"Failed download task for {task['lang_code']}: {e}")
            
        return None    

    def _scan_local_subtitles(self, directory, movie_id):
        """Fallback: Scan directory and return what currently exists."""
        results = []
        if not os.path.exists(directory): return []
        
        for filename in os.listdir(directory):
            if filename.endswith(".vtt"):
                lang_code = filename.replace(".vtt", "")
                results.append({
                    'language': lang_code,
                    'label': lang_code.upper(), # Simple fallback label
                    'src': os.path.join(settings.MEDIA_URL, 'downloads', 'subtitles', str(movie_id), filename)
                })
        return results