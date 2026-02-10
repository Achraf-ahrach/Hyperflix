
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .services import VideoService
import re
import os, sys
from django.utils import timezone
import threading
import libtorrent as lt
import logging
import time
from django.shortcuts import get_object_or_404
from .models import MovieFile
from rest_framework.pagination import PageNumberPagination
from .services import SubtitleService
from .utils import get_trackers, make_magnet_link
from django.conf import settings
from django.http import Http404, HttpResponse
from urllib.parse import quote
range_re = re.compile(r"bytes\s*=\s*(\d+)\s*-\s*(\d*)", re.I)

logger = logging.getLogger(__name__)

class TorrentSessionManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(TorrentSessionManager, cls).__new__(cls)
                cls._instance._initialize()
            return cls._instance

    def _initialize(self):
        self.session = lt.session()
        self.session.listen_on(6881, 6891)
        params = {
            'active_downloads': 10
        }
        self.session.apply_settings(params)
        self.handles = {}
        self.handle_locks = {}
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()

    def _cleanup_loop(self):
        while True:
            try:
                with self._lock:
                    for handle_id, handle in list(self.handles.items()):
                        if handle.is_valid() and handle.status().is_seeding:
                            if handle.status().active_time > 3600:
                                self.remove_torrent(handle_id)
            except Exception as e:
                logging.error(f"Error in cleanup loop: {str(e)}")
            time.sleep(300)

    def add_torrent(self, magnet_link, save_path):
        params = lt.parse_magnet_uri(magnet_link)
        params.save_path = save_path

        with self._lock:
            handle = self.session.add_torrent(params)
            handle_id = str(hash(magnet_link))
            self.handles[handle_id] = handle
            self.handle_locks[handle_id] = threading.Lock()
            return handle_id

    def get_handle(self, handle_id):
        return self.handles.get(handle_id)

    def get_handle_lock(self, handle_id):
        return self.handle_locks.get(handle_id)

    def remove_torrent(self, handle_id):
        with self._lock:
            if handle_id in self.handles:
                handle = self.handles[handle_id]
                if handle.is_valid():
                    self.session.remove_torrent(handle)
                del self.handles[handle_id]
                del self.handle_locks[handle_id]

torrent_manager = TorrentSessionManager()


def process_video_thread(video_id):
    try:
        movie_file = MovieFile.objects.get(id=video_id)
        movie_file.download_status = "DOWNLOADING"
        movie_file.save()

        downloads_dir = "/app/media"
        movie_dir = os.path.join(downloads_dir, "movies", str(movie_file.id))
        os.makedirs(movie_dir, exist_ok=True)
        logging.info(f"Using movie directory: {movie_dir}")

        handle_id = torrent_manager.add_torrent(movie_file.magnet_link, movie_dir)
        handle = torrent_manager.get_handle(handle_id)
        handle_lock = torrent_manager.get_handle_lock(handle_id)

        if not handle:
            logging.error(f"Failed to get torrent handle for movie {video_id}")
            movie_file.download_status = "ERROR"
            movie_file.save()
            return

        with handle_lock:
            handle.set_sequential_download(True)
            while not handle.has_metadata():
                time.sleep(1)

            torrent_info = handle.get_torrent_info()
            largest_file = max(torrent_info.files(), key=lambda f: f.size)
            file_path_in_torrent = largest_file.path
            downloaded_path = os.path.join(movie_dir, file_path_in_torrent)
            
            movie_file.file_path = os.path.join("movies", str(movie_file.id), file_path_in_torrent)
            movie_file.save()

            os.makedirs(os.path.dirname(downloaded_path), exist_ok=True)

            video_service = VideoService()
            conversion_started = False
            current_segment = 0
            video_duration = None
            first_segment_ready = False
            last_attempt_time = 0

            while True:
                status = handle.status()
                progress = status.progress * 100
                
                if int(time.time()) % 2 == 0:
                    state_str = ['queued', 'checking', 'downloading meta', 'downloading', 'finished', 'seeding', 'allocating']
                    print(
                        f"Progress: {progress:.2f}% | "
                        f"Peers: {status.num_peers} | "
                        f"Speed: {status.download_rate / 1000:.1f} kB/s | "
                        f"State: {state_str[status.state]}", 
                        flush=True
                    )
                # ---------------

                movie_file.download_progress = progress
                
                if not conversion_started and os.path.exists(downloaded_path):
                    current_time = time.time()
                    if current_time - last_attempt_time > 2:
                        last_attempt_time = current_time
                        try:
                            video_duration = video_service.get_video_duration(downloaded_path)
                            if video_duration:
                                conversion_started = True
                                movie_file.download_status = "DL_AND_CONVERT"
                                movie_file.save()
                                logging.info(f"Starting segmentation at {progress:.2f}%")
                        except Exception as e:
                            logging.debug(f"File header not ready yet: {e}")

                if conversion_started and video_duration:
                    segment_start_time = current_segment * video_service.segment_duration
                    required_progress = (segment_start_time + video_service.segment_duration) / video_duration * 100
                    required_progress = min(required_progress + 5, 100) 

                    if progress >= required_progress:
                        try:
                            if current_segment not in video_service.processed_segments:
                                success = video_service.convert_segment(
                                    downloaded_path,
                                    movie_dir,
                                    current_segment,
                                    video_duration
                                )
                                if success:
                                    current_segment += 1
                                    
                                    if current_segment == 1:
                                        rel_path = os.path.relpath(downloaded_path, movie_dir)
                                        dir_path = os.path.dirname(rel_path)
                                        
                                        first_segment = "segment_000.ts"
                                        
                                        if dir_path:
                                            first_segment = os.path.join(dir_path, first_segment)
                                        # -----------------------
                                        
                                        movie_file.file_path = os.path.join("movies", str(movie_file.id), first_segment)
                                        movie_file.download_status = "PLAYABLE"
                                        first_segment_ready = True
                                        movie_file.save()
                                        logging.info("First segment ready, movie is now playable")

                        except Exception as e:
                            logging.error(f"Error converting segment {current_segment}: {e}")
                            if video_service.segment_retry_count.get(current_segment, 0) >= video_service.max_retries:
                                current_segment += 1

                movie_file.save()

                if status.is_seeding:
                    break

                time.sleep(1)

            if video_duration:
                remaining_segments = int(video_duration / video_service.segment_duration) + 1
                while current_segment < remaining_segments:
                    try:
                        if current_segment not in video_service.processed_segments:
                            success = video_service.convert_segment(
                                downloaded_path,
                                movie_dir,
                                current_segment,
                                video_duration
                            )
                            if success:
                                current_segment += 1
                            elif video_service.segment_retry_count.get(current_segment, 0) >= video_service.max_retries:
                                current_segment += 1
                    except Exception as e:
                        logging.error(f"Error converting final segments: {e}")
                        if video_service.segment_retry_count.get(current_segment, 0) >= video_service.max_retries:
                            current_segment += 1
                    
                    time.sleep(0.1) 

            if not video_service.failed_segments:
                movie_file.download_status = "READY"
            else:
                if not first_segment_ready:
                    movie_file.download_status = "ERROR"
                logging.error(f"Failed segments: {sorted(list(video_service.failed_segments))}")
            movie_file.save()

    except Exception as e:
        logging.error(f"Error processing video {video_id}: {str(e)}")
        movie_file.download_status = "ERROR"
        movie_file.save()

class VideoViewSet(viewsets.ViewSet):
    """
    ViewSet for video operations.
    """

    @action(detail=True, methods=['get'])
    def playlist(self, request, pk=None):
        """
        Generates the HLS playlist (.m3u8) scanning for 'segment_xxx.ts'.
        """
        movie = get_object_or_404(MovieFile, pk=pk)
        
        if not movie.file_path:
            return Response(
                {"status": "pending", "detail": "File path not set."}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        absolute_file_path = os.path.join(settings.MEDIA_ROOT, movie.file_path)
        output_dir = os.path.dirname(absolute_file_path)
        
        if not os.path.exists(output_dir):
            return Response(
                {"status": "pending", "detail": "Transcoding directory not created yet."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        found_segments = []
        
        pattern = re.compile(r"^segment_(\d+)\.ts$")
        
        try:
            all_files = os.listdir(output_dir)
            for f in all_files:
                match = pattern.match(f)
                if match:
                    found_segments.append((int(match.group(1)), f))
        except Exception:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not found_segments:
            return Response(
                {"status": "pending", "detail": "No segments generated yet."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        found_segments.sort(key=lambda x: x[0])
        segments = [x[1] for x in found_segments]

        is_finished = movie.download_status == 'READY'
        playlist_type = "VOD" if is_finished else "EVENT"

        m3u8_content = [
            "#EXTM3U",
            "#EXT-X-VERSION:3",
            "#EXT-X-TARGETDURATION:10", 
            "#EXT-X-MEDIA-SEQUENCE:0",
            f"#EXT-X-PLAYLIST-TYPE:{playlist_type}", 
        ]
        
        for seg in segments:
            m3u8_content.append(f"#EXTINF:10.0,")
            
            m3u8_content.append(f"/api/video/{pk}/stream_ts/?file={seg}")

        if is_finished:
            m3u8_content.append("#EXT-X-ENDLIST")
            
        return HttpResponse("\n".join(m3u8_content), content_type="application/vnd.apple.mpegurl")

    @action(detail=True, methods=['get'])
    def stream_ts(self, request, pk=None):
        """
        Serves specific .ts segments via Nginx X-Accel-Redirect.
        Expected URL: /api/video/1/stream_ts/?file=segment_001.ts
        """
        file_name = request.query_params.get('file')
        
        if not file_name:
            return HttpResponse(status=400)
            
        if '..' in file_name or '/' in file_name:
             return HttpResponse(status=400)

        movie = get_object_or_404(MovieFile, pk=pk)
        
        relative_dir = os.path.dirname(movie.file_path)
        
        absolute_path = os.path.join(settings.MEDIA_ROOT, relative_dir, file_name)
        if not os.path.exists(absolute_path):
            return HttpResponse(status=404)

        clean_relative_dir = relative_dir.lstrip('/')
        
        nginx_path = os.path.join('/media', clean_relative_dir, file_name)
        
        response = HttpResponse()
        response['X-Accel-Redirect'] = quote(nginx_path) 
        response['Content-Type'] = 'video/MP2T'
        return response
    @action(detail=True, methods=["post"], url_path="start")
    def start_stream(self, request, pk=None):
        """
        Start movie download and processing (Threading).
        """
        magnet_link = request.data.get("magnet_link")
        imdb_id = request.data.get("imdb_id")
        
        if not magnet_link or not imdb_id:
             return Response({"error": "Magnet link and IMDB ID required"}, status=status.HTTP_400_BAD_REQUEST)

        magnet_link = make_magnet_link(magnet_link) 
        
        movie_file, created = MovieFile.objects.get_or_create(
            imdb_id=imdb_id, 
            defaults={
                "magnet_link": magnet_link, 
                "download_status": "PENDING", 
                "download_progress": 0
            }
        )

        if movie_file.download_status in ["DOWNLOADING", "CONVERTING", "READY"]:
            return Response({
                "status": movie_file.download_status, 
                "progress": movie_file.download_progress, 
                "id": movie_file.id
            })


        thread = threading.Thread(target=process_video_thread, args=(movie_file.id,))
        thread.daemon = True
        thread.start()

        return Response({
            "status": "PENDING", 
            "id": movie_file.id, 
            "imdb_id": movie_file.imdb_id
        })

# ++++++++++++++++++++++++++++++++++++++++++++++++

class SubtitleViewSet(viewsets.ViewSet):
    subtitle_service = SubtitleService() 

    def list(self, request):
        movie_id = request.query_params.get("movie_id")
        if not movie_id:
            return Response({"error": "movie_id required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            movie = MovieFile.objects.get(id=movie_id)
            subtitles = self.subtitle_service.fetch_all_subtitles(movie)
            return Response(subtitles, status=status.HTTP_200_OK)

        except MovieFile.DoesNotExist:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "Internal error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)