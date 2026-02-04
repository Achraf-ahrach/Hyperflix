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

    def convert_srt_to_vtt(self, srt_path: str) -> str:
        """
        Convert an SRT file to VTT format and return the path to the VTT file.
        """
        vtt_path = srt_path.replace('.srt', '.vtt')
        try:
            srt_to_vtt(srt_path, vtt_path)
            return vtt_path
        except Exception as e:
            logging.error(f"Error converting SRT to VTT: {str(e)}")
            return None

    def fetch_all_subtitles(self, movie: MovieFile) -> list:
        """
        Downloads the best available subtitle for EVERY language for a specific movie.
        Returns a list of dicts suitable for frontend dropdowns.
        """
        subtitles_dir = os.path.join(settings.MEDIA_ROOT, 'downloads', 'subtitles', str(movie.id))
        os.makedirs(subtitles_dir, exist_ok=True)

        # 1. Movie-Level Lock (prevents parallel 'download all' triggers)
        lock_file = os.path.join(subtitles_dir, "download_process.lock")
        
        # Simple lock check (in a real app, consider using a proper Redis lock or DB lock)
        if os.path.exists(lock_file):
            logging.info(f"Subtitle download already in progress for Movie ID {movie.id}. Returning existing.")
            return self._scan_local_subtitles(subtitles_dir, movie.id)

        with open(lock_file, 'w') as f:
            f.write("locked")

        available_subtitles = []
        processed_langs = set()

        try:
            logging.info(f"Fetching metadata for ALL subtitles: {movie.imdb_id}")
            
            # 2. Query API without 'languages' param to get EVERYTHING
            response = requests.get(
                f"{self.BASE_URL}/subtitles",
                headers=self.headers,
                params={
                    "imdb_id": movie.imdb_id,
                    "order_by": "ratings" # Ensures the first result per language is the best one
                }
            )
            response.raise_for_status()
            data = response.json()

            # 3. Iterate and Filter Best-in-Class
            download_tasks = []
            
            for item in data.get('data', []):
                attributes = item.get('attributes', {})
                lang_code = attributes.get('language') # e.g., 'en', 'fr'
                
                # If we already have a subtitle for this language (local or planned), skip duplicates
                if not lang_code or lang_code in processed_langs:
                    continue
                
                processed_langs.add(lang_code)

                # Check if file already exists locally to skip download
                local_vtt_name = f"{lang_code}.vtt"
                local_vtt_path = os.path.join(subtitles_dir, local_vtt_name)
                
                if os.path.exists(local_vtt_path):
                    # Append existing file to results
                    available_subtitles.append({
                        'language': lang_code,
                        'label': attributes.get('language_name') or lang_code.upper(),
                        'src': os.path.join(settings.MEDIA_URL, 'downloads', 'subtitles', str(movie.id), local_vtt_name)
                    })
                    continue

                # Prepare download info if not exists
                files = attributes.get('files', [])
                if files:
                    file_id = files[0].get('file_id')
                    # Add to task list for processing
                    download_tasks.append({
                        'file_id': file_id,
                        'lang_code': lang_code,
                        'lang_name': attributes.get('language_name') or lang_code.upper(),
                        'subtitles_dir': subtitles_dir,
                        'movie_id': movie.id
                    })

            # 4. Sequential Download (Safe) or Parallel (Fast)
            # processing sequentially here to be safe with rate limits
            for task in download_tasks:
                result = self._download_single_subtitle(task)
                if result:
                    available_subtitles.append(result)

        except Exception as e:
            logging.error(f"Error fetching subtitles for {movie.imdb_id}: {e}")
            # Fallback: return whatever is on disk
            return self._scan_local_subtitles(subtitles_dir, movie.id)
        
        finally:
            if os.path.exists(lock_file):
                os.remove(lock_file)
        
        # Sort by language name for the frontend
        available_subtitles.sort(key=lambda x: x['label'])
        return available_subtitles

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