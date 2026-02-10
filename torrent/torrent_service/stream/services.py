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
import requests, subprocess
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures

logger = logging.getLogger(__name__)
range_re = re.compile(r"bytes\s*=\s*(\d+)\s*-\s*(\d*)", re.I)

class VideoService:
    def __init__(self):
        self.segment_duration = 10 

    def get_video_duration(self, file_path):
        try:
            cmd = [
                'ffprobe', '-v', 'error', 
                '-show_entries', 'format=duration', 
                '-of', 'default=noprint_wrappers=1:nokey=1', 
                file_path
            ]
            output = subprocess.check_output(cmd, timeout=10).decode().strip()
            return float(output)
        except Exception:
            return None

    def convert_all_segments(self, source_path, output_dir, segment_index):
        """
        CPU-Safe Transcoding (Includes 1080p).
        Locked to 2 Cores + Ultrafast Preset to prevent System Freeze.
        """
        start_time = segment_index * self.segment_duration
        
        res_dirs = {}
        resolutions = ["1080p", "720p", "480p", "360p"]
        
        for res in resolutions:
            path = os.path.join(output_dir, res)
            os.makedirs(path, exist_ok=True)
            res_dirs[res] = os.path.join(path, f"segment_{segment_index:03d}.ts")

        if all(os.path.exists(p) and os.path.getsize(p) > 0 for p in res_dirs.values()):
            return True

        # Split input into 4 streams (1080, 720, 480, 360)
        filter_complex = (
            "[0:v]split=4[v1][v2][v3][v4];"
            "[v1]scale=-2:1080,format=yuv420p[1080out];"
            "[v2]scale=-2:720,format=yuv420p[720out];"
            "[v3]scale=-2:480,format=yuv420p[480out];"
            "[v4]scale=-2:360,format=yuv420p[360out]"
        )

        cmd = [
            'ffmpeg', '-hide_banner', '-loglevel', 'error',
            '-threads', '2',  # <--- CRITICAL: Leaves 2 cores free for your OS
            '-ss', str(start_time),
            '-t', str(self.segment_duration),
            '-i', source_path,
            '-filter_complex', filter_complex,
        ]

        # 3. Stream Configuration
        configs = [
            ("1080p", "[1080out]", "4000k", "8000k"),
            ("720p",  "[720out]",  "2000k", "4000k"),
            ("480p",  "[480out]",  "1000k", "2000k"),
            ("360p",  "[360out]",  "600k",  "1200k"),
        ]

        for res_name, map_label, bitrate, bufsize in configs:
            cmd.extend([
                '-map', map_label,
                '-c:v', 'libx264',
                '-b:v', bitrate,
                '-maxrate', bitrate,
                '-bufsize', bufsize,
                '-preset', 'ultrafast',  #  Lowest CPU usage possible
                '-profile:v', 'main',
                
                # Audio
                '-map', '0:a', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100',
                
                # HLS Glue
                '-force_key_frames', 'expr:gte(t,0)',
                '-output_ts_offset', str(start_time),
                '-muxdelay', '0',
                
                '-f', 'mpegts', '-y',
                res_dirs[res_name]
            ])

        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            return True
        except subprocess.CalledProcessError as e:
            err = e.stderr.decode()
            if "invalid as first byte" in err or "Invalid data found" in err:
                return False
            
            logger.error(f"FFmpeg CPU Error: {err}")
            return False

# ++++++++++++++++++++++++++++++++++++++++++


class SubtitleService:
    BASE_URL = "https://api.opensubtitles.com/api/v1"

    def __init__(self):
        """Initialize the subtitle service with authentication"""
        self.api_key = os.getenv("OPENSUBTITLE_API_KEY")
        if not self.api_key:
            raise ValueError("OPENSUBTITLE_API_KEY environment variable not set")
        
        self.token = self.login_and_get_token()
        
        self.headers = {
            "Api-Key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "MySubScript/1.0",
            "Authorization": f"Bearer {self.token}" if self.token else ""
        }
        
        if self.token:
            self.check_user_info()

    def login_and_get_token(self):
        """Authenticate with OpenSubtitles API and get JWT token"""
        url = f"{self.BASE_URL}/login"
        
        headers = {
            "Api-Key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "MySubScript/1.0"
        }
        
        username = os.getenv("OPENSUBTITLE_USER")
        password = os.getenv("OPENSUBTITLE_PASS")
        
        if not username or not password:
            logging.error("OPENSUBTITLE_USER or OPENSUBTITLE_PASS environment variables not set")
            return None
            
        payload = {
            "username": username,
            "password": password
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            jwt_token = data.get("token")
            
            if jwt_token:
                logging.info("OpenSubtitles login successful")
            else:
                logging.error("No token received from login response")
                
            return jwt_token

        except requests.exceptions.RequestException as err:
            logging.error(f"Login failed: {err}")
            return None

    def check_user_info(self):
        """Check current user info and download quota"""
        try:
            response = requests.get(
                f"{self.BASE_URL}/infos/user",
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            user_data = response.json().get('data', {})
            
            username = user_data.get('username', 'Unknown')
            downloads_count = user_data.get('downloads_count', 'N/A')
            remaining = user_data.get('remaining_downloads', 'N/A')
            
            logging.info(f"OpenSubtitles User: {username}")
            logging.info(f"Downloads today: {downloads_count}, Remaining: {remaining}")
            
            return user_data
            
        except Exception as e:
            logging.warning(f"Failed to get user info: {e}")
            return None

    def convert_srt_to_vtt(self, srt_path):
        """Convert SRT subtitle file to VTT format"""
        if not os.path.exists(srt_path):
            return None
            
        if os.path.getsize(srt_path) < 10:
            os.remove(srt_path)
            return None

        vtt_path = srt_path.replace('.srt', '.vtt')

        try:
            try:
                with open(srt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                with open(srt_path, 'r', encoding='latin-1') as f:
                    content = f.read()
            
            content = "WEBVTT\n\n" + re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})', r'\1.\2', content)

            with open(vtt_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            logging.debug(f"Converted {srt_path} to VTT format")
            return vtt_path
            
        except Exception as e:
            logging.error(f"Failed to convert SRT to VTT: {e}")
            if os.path.exists(srt_path):
                os.remove(srt_path)
            return None

    def fetch_all_subtitles(self, movie) -> list:
        """
        Fetch all available subtitles for a movie
        Returns list of subtitle dictionaries with language, label, and src
        """
        subtitles_dir = os.path.join(
            settings.MEDIA_ROOT, 
            'downloads', 
            'subtitles', 
            str(movie.id)
        )
        os.makedirs(subtitles_dir, exist_ok=True)
        existing_subs = self._scan_local_subtitles(subtitles_dir, movie.id)
        if existing_subs:
            logging.info(f"Local subtitles found for movie {movie.id}. Skipping download.")
            return existing_subs
        
        lock_file = os.path.join(subtitles_dir, "download.lock")
        if os.path.exists(lock_file):
            logging.info(f"Subtitles download already in progress for movie {movie.id}")
            return self._scan_local_subtitles(subtitles_dir, movie.id)

        with open(lock_file, 'w') as f:
            f.write("locked")

        try:
            imdb_id_clean = str(movie.imdb_id).replace('tt', '')
            
            logging.info(f"Searching subtitles for IMDB ID: {imdb_id_clean}")
            response = requests.get(
                f"{self.BASE_URL}/subtitles",
                headers=self.headers,
                params={
                    "imdb_id": int(imdb_id_clean),
                    "order_by": "download_count",
                    "order_direction": "desc"
                },
                timeout=15
            )
            response.raise_for_status()
            
            raw_data = response.json().get('data', [])
            logging.info(f"Found {len(raw_data)} subtitle options")
            
            tasks_to_download = {}
            available_subtitles = []

            for item in raw_data:
                attributes = item.get('attributes', {})
                lang_code = attributes.get('language')
                
                if not lang_code or lang_code in tasks_to_download:
                    continue

                local_filename = f"{lang_code}.vtt"
                local_path = os.path.join(subtitles_dir, local_filename)

                if os.path.exists(local_path):
                    tasks_to_download[lang_code] = None
                    available_subtitles.append({
                        'language': lang_code,
                        'label': attributes.get('language_name', lang_code.upper()),
                        'src': os.path.join(
                            settings.MEDIA_URL, 
                            'downloads', 
                            'subtitles', 
                            str(movie.id), 
                            local_filename
                        )
                    })
                    continue

                files = attributes.get('files', [])
                if files:
                    tasks_to_download[lang_code] = {
                        'file_id': files[0]['file_id'],
                        'lang_code': lang_code,
                        'lang_name': attributes.get('language_name', lang_code.upper()),
                        'subtitles_dir': subtitles_dir,
                        'movie_id': movie.id
                    }

            clean_tasks = [t for t in tasks_to_download.values() if t is not None]
            
            if clean_tasks:
                logging.info(f"Downloading {len(clean_tasks)} new subtitle files")
                
                for i, task in enumerate(clean_tasks):
                    if i > 0:
                        time.sleep(1.5)
                    
                    result = self._download_single_subtitle(task)
                    if result:
                        available_subtitles.append(result)

            available_subtitles.sort(key=lambda x: x['label'])
            logging.info(f"Total available subtitles: {len(available_subtitles)}")
            
            return available_subtitles

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                logging.error("Rate limit exceeded. Please wait before retrying.")
            else:
                logging.error(f"HTTP error fetching subtitles: {e}")
            return self._scan_local_subtitles(subtitles_dir, movie.id)
            
        except Exception as e:
            logging.error(f"Error fetching subtitles: {e}")
            return self._scan_local_subtitles(subtitles_dir, movie.id)
        
        finally:
            if os.path.exists(lock_file):
                try:
                    os.remove(lock_file)
                except:
                    pass

    def _download_single_subtitle(self, task):
        """
        Download a single subtitle file
        1. Request download link from API
        2. Download the file
        3. Convert to VTT format
        """
        MAX_RETRIES = 3
        
        try:
            payload = {"file_id": int(task['file_id'])}
            
            link_response = requests.post(
                f"{self.BASE_URL}/download",
                headers=self.headers,
                json=payload,
                timeout=20
            )
            
            if link_response.status_code == 429:
                reset_time = link_response.headers.get('X-RateLimit-Reset', 60)
                logging.warning(f"Rate limited. Need to wait {reset_time}s")
                return None
                
            link_response.raise_for_status()
            
            download_data = link_response.json()
            real_file_url = download_data.get('link')
            
            if not real_file_url:
                logging.error(f"No download link returned for {task['lang_code']}")
                return None

            srt_path = os.path.join(task['subtitles_dir'], f"{task['lang_code']}.srt")
            
            time.sleep(0.3)
            
            for attempt in range(MAX_RETRIES):
                try:
                    download_headers = {
                        'User-Agent': 'MySubScript/1.0'
                    }
                    
                    file_response = requests.get(
                        real_file_url,
                        headers=download_headers,
                        timeout=30,
                        allow_redirects=True
                    )
                    
                    if file_response.status_code == 403:
                        logging.warning(f"403 Forbidden for {task['lang_code']} (attempt {attempt + 1})")
                        
                        if attempt < MAX_RETRIES - 1:
                            time.sleep(2)
                            link_response = requests.post(
                                f"{self.BASE_URL}/download",
                                headers=self.headers,
                                json=payload,
                                timeout=20
                            )
                            
                            if link_response.status_code == 429:
                                logging.error("Rate limited on retry")
                                return None
                                
                            link_response.raise_for_status()
                            real_file_url = link_response.json().get('link')
                            
                            if not real_file_url:
                                return None
                                
                            time.sleep(0.3)
                            continue
                        else:
                            logging.error(f"Failed to download {task['lang_code']} after {MAX_RETRIES} attempts")
                            return None
                    
                    file_response.raise_for_status()
                    
                    content = file_response.content
                    
                    if not content or len(content) < 10:
                        raise ValueError("Empty or too small subtitle file")
                    
                    if b"<!DOCTYPE html>" in content[:200] or b"<html" in content[:200]:
                        raise ValueError("Downloaded HTML instead of subtitles")
                    
                    if not (b'-->' in content or re.search(rb'\d{2}:\d{2}:\d{2}', content[:1000])):
                        raise ValueError("File doesn't appear to be a valid subtitle")

                    with open(srt_path, 'wb') as f:
                        f.write(content)
                    
                    logging.info(f"Successfully downloaded {task['lang_code']} subtitle ({len(content)} bytes)")
                    break

                except requests.exceptions.HTTPError as e:
                    logging.warning(f"HTTP error on attempt {attempt + 1} for {task['lang_code']}: {e}")
                    if attempt == MAX_RETRIES - 1:
                        return None
                    time.sleep(2 ** attempt)
                    
                except ValueError as e:
                    logging.warning(f"Validation error for {task['lang_code']}: {e}")
                    if attempt == MAX_RETRIES - 1:
                        return None
                    time.sleep(2)
                    
                except Exception as e:
                    logging.warning(f"Attempt {attempt + 1} failed for {task['lang_code']}: {e}")
                    if attempt == MAX_RETRIES - 1:
                        return None
                    time.sleep(2)


            if os.path.exists(srt_path) and os.path.getsize(srt_path) > 0:
                vtt_path = self.convert_srt_to_vtt(srt_path)
                
                try:
                    os.remove(srt_path)
                except Exception as e:
                    logging.warning(f"Failed to remove SRT file: {e}")

                if vtt_path and os.path.exists(vtt_path):
                    return {
                        'language': task['lang_code'],
                        'label': task['lang_name'],
                        'src': os.path.join(
                            settings.MEDIA_URL,
                            'downloads',
                            'subtitles',
                            str(task['movie_id']),
                            f"{task['lang_code']}.vtt"
                        )
                    }

        except requests.exceptions.RequestException as e:
            logging.error(f"Network error downloading {task['lang_code']}: {e}")
        except Exception as e:
            logging.error(f"Critical failure downloading {task['lang_code']}: {e}")
            
        return None

    def _scan_local_subtitles(self, directory, movie_id):
        """Scan directory for existing VTT subtitle files"""
        results = []
        
        if not os.path.exists(directory):
            return []
            
        try:
            for filename in os.listdir(directory):
                if filename.endswith(".vtt") and filename != "download.lock":
                    lang_code = filename.replace(".vtt", "")
                    results.append({
                        'language': lang_code,
                        'label': lang_code.upper(),
                        'src': os.path.join(
                            settings.MEDIA_URL,
                            'downloads',
                            'subtitles',
                            str(movie_id),
                            filename
                        )
                    })
            
            if results:
                logging.info(f"Found {len(results)} local subtitle files")
                
        except Exception as e:
            logging.error(f"Error scanning local subtitles: {e}")
            
        return results