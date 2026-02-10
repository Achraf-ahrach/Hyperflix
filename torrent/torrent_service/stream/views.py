
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
    movie_file = None
    try:
        movie_file = MovieFile.objects.get(id=video_id)
        movie_file.download_status = "DOWNLOADING"
        movie_file.save()

        movies_root = os.path.join(settings.MEDIA_ROOT, "movies")
        movie_dir = os.path.join(movies_root, str(movie_file.id))
        os.makedirs(movie_dir, exist_ok=True)

        logging.info(f"Adding torrent: {movie_file.magnet_link}")
        handle_id = torrent_manager.add_torrent(movie_file.magnet_link, movie_dir)
        handle = torrent_manager.get_handle(handle_id)
        
        if not handle:
            raise Exception("No torrent handle")

        attempts = 0
        while not handle.has_metadata():
            if attempts > 60: raise Exception("Metadata timeout")
            time.sleep(1)
            attempts += 1

        info = handle.get_torrent_info()
        largest = max(info.files(), key=lambda f: f.size)
        downloaded_path = os.path.join(movie_dir, largest.path)
        
        movie_file.file_path = os.path.relpath(downloaded_path, settings.MEDIA_ROOT)
        movie_file.save()

        handle.set_sequential_download(True)

        service = VideoService()
        conversion_started = False
        current_segment = 0
        video_duration = None
        
        resolutions = ["1080p", "720p", "480p", "360p"]

        while True:
            status = handle.status()
            progress = status.progress * 100
            movie_file.download_progress = progress
            
            if not conversion_started:
                if os.path.exists(downloaded_path) and os.path.getsize(downloaded_path) > 10 * 1024 * 1024:
                    dur = service.get_video_duration(downloaded_path)
                    if dur:
                        video_duration = dur
                        conversion_started = True
                        movie_file.download_status = "DL_AND_CONVERT"
                        logging.info(f"Header ready. Duration: {dur}s")

            if conversion_started and video_duration:
                segment_end_time = (current_segment + 1) * service.segment_duration
                required_progress = (segment_end_time / video_duration) * 100
                
                if progress >= (required_progress + 2) or status.is_seeding:
                    
                    success_all = True
                    for res in resolutions:
                        ok = service.convert_segment(
                            downloaded_path, 
                            movie_dir,
                            current_segment, 
                            resolution=res
                        )
                        if not ok: success_all = False

                    if success_all:
                        if current_segment == 0:
                            movie_file.download_status = "PLAYABLE"
                            logging.info("First segment ready! Playable.")
                        current_segment += 1
                        movie_file.save()

            if status.is_seeding or progress >= 100:
                break
            
            time.sleep(1)
            if int(time.time()) % 5 == 0: movie_file.save()

        if video_duration:
            total_segs = int(video_duration / service.segment_duration) + 1
            while current_segment < total_segs:
                for res in resolutions:
                    service.convert_segment(downloaded_path, movie_dir, current_segment, res)
                current_segment += 1

        movie_file.download_status = "READY"
        movie_file.save()

    except Exception as e:
        logging.error(f"Thread Error: {e}")
        if movie_file:
            movie_file.download_status = "ERROR"
            movie_file.save()


class VideoViewSet(viewsets.ViewSet):
    """
    ViewSet for video operations supporting Adaptive Bitrate (ABR).
    Assumes Transcoder outputs to: /media/movies/{id}/{resolution}/
    """

    @action(detail=True, methods=['get'])
    def playlist(self, request, pk=None):
        """
        Main HLS Endpoint.
        - No params: Returns MASTER playlist (list of qualities).
        - ?res=1080p: Returns MEDIA playlist (list of segments).
        """

        movie = get_object_or_404(MovieFile, pk=pk)
        resolution = request.query_params.get('res')

        base_dir = os.path.join(settings.MEDIA_ROOT, 'movies', str(pk))

        if not os.path.exists(base_dir):
            return Response(
                {"status": "pending", "detail": "Transcoding directory missing."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if not resolution:
            return self._generate_master_playlist(pk, base_dir)
        else:
            return self._generate_media_playlist(pk, base_dir, resolution, movie)

    def _generate_master_playlist(self, pk, base_dir):
        """
        Scans for resolution folders (1080p, 720p, etc) in /media/movies/{id}/
        """
        resolutions = ["1080p", "720p", "480p", "360p"]
        found_res = []

        for r in resolutions:
            if os.path.exists(os.path.join(base_dir, r)):
                found_res.append(r)
        
        if not found_res:
             return Response({"status": "pending"}, status=status.HTTP_404_NOT_FOUND)

        content = ["#EXTM3U", "#EXT-X-VERSION:3"]
        
        for res in found_res:
            bw = self._get_bandwidth(res)
            res_dim = self._get_res_dim(res)
            content.append(f'#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={res_dim},NAME="{res}"')
            content.append(f'/api/video/{pk}/playlist/?res={res}')

        return HttpResponse("\n".join(content), content_type="application/vnd.apple.mpegurl")

    def _generate_media_playlist(self, pk, base_dir, resolution, movie):
        """
        Generates segment list for a specific resolution folder.
        """
        target_dir = os.path.join(base_dir, resolution)
        
        if not os.path.exists(target_dir):
            return Response(status=status.HTTP_404_NOT_FOUND)

        found = []
        pattern = re.compile(r"^segment_(\d+)\.ts$")
        try:
            for f in os.listdir(target_dir):
                match = pattern.match(f)
                if match:
                    found.append((int(match.group(1)), f))
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not found:
             return Response(status=status.HTTP_404_NOT_FOUND)

        found.sort(key=lambda x: x[0])
        segments = [x[1] for x in found]

        is_finished = movie.download_status == 'READY'
        pl_type = "VOD" if is_finished else "EVENT"

        content = [
            "#EXTM3U",
            "#EXT-X-VERSION:3",
            "#EXT-X-TARGETDURATION:10",
            "#EXT-X-MEDIA-SEQUENCE:0",
            f"#EXT-X-PLAYLIST-TYPE:{pl_type}"
        ]

        for seg in segments:
            content.append("#EXTINF:10.0,")
            content.append(f"/api/video/{pk}/stream_ts/?file={seg}&res={resolution}")

        if is_finished:
            content.append("#EXT-X-ENDLIST")

        return HttpResponse("\n".join(content), content_type="application/vnd.apple.mpegurl")

    @action(detail=True, methods=['get'])
    def stream_ts(self, request, pk=None):
        """
        Serves the .ts file via Nginx X-Accel-Redirect.
        URL: .../stream_ts/?file=segment_001.ts&res=720p
        """
        file_name = request.query_params.get('file')
        res = request.query_params.get('res', '720p')

        if not file_name or '..' in file_name: 
            return HttpResponse(status=400)

        nginx_path = os.path.join('/media', 'movies', str(pk), res, file_name)

        response = HttpResponse()
        response['X-Accel-Redirect'] = quote(nginx_path)
        response['Content-Type'] = 'video/MP2T'
        return response


    def _get_bandwidth(self, res):
        return {
            "1080p": 5000000, # 5 Mbps
            "720p":  2800000, # 2.8 Mbps
            "480p":  1400000, # 1.4 Mbps
            "360p":  800000   # 800 Kbps
        }.get(res, 1000000)

    def _get_res_dim(self, res):
        return {
            "1080p": "1920x1080",
            "720p": "1280x720", 
            "480p": "854x480",
            "360p": "640x360"
        }.get(res, "1280x720")

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