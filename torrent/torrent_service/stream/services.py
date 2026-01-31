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


range_re = re.compile(r"bytes\s*=\s*(\d+)\s*-\s*(\d*)", re.I)


class VideoService:
    def __init__(self):
        self.segment_duration = 10  # 10 seconds
        self.processed_segments = set()
        self.failed_segments = set()
        self.segment_retry_count = {}
        self.segment_last_attempt = {}
        self.max_retries = 3
        self.retry_cooldown = 30  # Wait 30 seconds before retrying a failed segment

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
        
        # 1. Sanity Check: Ensure file actually exists before asking FFmpeg
        if not os.path.exists(input_path):
            logging.error(f"convert_segment: Input file missing at {input_path}")
            return False

        start_time = current_segment * self.segment_duration
        
        # Get relative path structure
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
            # FIX: Prepend 'file:' to handle special chars like [] in filenames
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
            
            # Run ffmpeg
            stream.run(capture_stdout=True, capture_stderr=True)

            if os.path.exists(segment_path) and os.path.getsize(segment_path) > 0:
                logging.info(f"✓ Converted segment {current_segment}")
                self.processed_segments.add(current_segment)
                return True
            else:
                logging.error(f"Output file not created for segment {current_segment}")
                return False

        except ffmpeg.Error as e:
            # Log the specific FFmpeg error output
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

    def fetch_subtitles(self, movie: MovieFile, lang: str) -> list:
        """
        Fetch and download subtitles for a movie in the specified language from OpenSubtitles API.
        Returns a list of downloaded subtitle information.
        """
        try:
            response = requests.get(
                f"{self.BASE_URL}/subtitles",
                headers=self.headers,
                params={
                    "imdb_id": movie.imdb_id,
                    "languages": lang,
                    "order_by": "ratings"
                }
            )
            response.raise_for_status()
            data = response.json()

            subtitles = []
            for item in data.get('data', []):
                attributes = item.get('attributes', {})
                files = attributes.get('files', [])
                if files:
                    file_id = files[0].get('file_id')
                    if file_id:
                        try:
                            download_response = requests.post(
                                f"{self.BASE_URL}/download",
                                headers=self.headers,
                                json={"file_id": file_id}
                            )
                            download_response.raise_for_status()
                            download_data = download_response.json()
                            download_url = download_data.get('link')

                            if download_url:
                                subtitles_dir = os.path.join(settings.MEDIA_ROOT, 'downloads/subtitles', str(movie.id))
                                os.makedirs(subtitles_dir, exist_ok=True)

                                srt_path = os.path.join(subtitles_dir, f"{lang}.srt")
                                file_response = requests.get(download_url)
                                file_response.raise_for_status()

                                with open(srt_path, 'wb') as f:
                                    f.write(file_response.content)

                                # Convert SRT to VTT
                                vtt_path = self.convert_srt_to_vtt(srt_path)
                                if vtt_path:
                                    vtt_relative_path = os.path.join('downloads/subtitles', str(movie.id), f"{lang}.vtt")
                                else:
                                    vtt_relative_path = None

                                subtitles.append({
                                    'language': attributes.get('language', lang),
                                    'language_name': 'English' if lang == 'en' else lang.upper(),
                                    'file_path': vtt_relative_path or os.path.join('subtitles', str(movie.id), f"{lang}.srt")
                                })
                                logging.info(f"Successfully downloaded subtitle to {srt_path} and converted to VTT")
                                break

                        except requests.exceptions.RequestException as e:
                            logging.error(f"Error downloading subtitle with file_id {file_id}: {str(e)}")
                            continue
                        except Exception as e:
                            logging.error(f"Unexpected error downloading subtitle with file_id {file_id}: {str(e)}")
                            continue

            return subtitles

        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching subtitles: {str(e)}")
            return []
        except Exception as e:
            logging.error(f"Unexpected error while fetching subtitles: {str(e)}")
            return [] 

