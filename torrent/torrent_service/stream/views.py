
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
from concurrent.futures import ThreadPoolExecutor
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

def wait_for_header(file_path, timeout=60):
    """Waits until file has non-zero data at the start"""
    start = time.time()
    while time.time() - start < timeout:
        if os.path.exists(file_path) and os.path.getsize(file_path) > 1024:
            try:
                with open(file_path, 'rb') as f:
                    if any(b != 0 for b in f.read(1024)): return True
            except: pass
        time.sleep(1)
    return False

def process_video_thread(video_id):
    movie_file = None
    try:
        movie_file = MovieFile.objects.get(id=video_id)
        movie_file.download_status = "DOWNLOADING"
        movie_file.save()

        movies_root = os.path.join(settings.MEDIA_ROOT, "movies")
        movie_dir = os.path.join(movies_root, str(movie_file.id))
        os.makedirs(movie_dir, exist_ok=True)

        logger.info(f"Starting torrent: {movie_file.magnet_link}")
        handle_id = torrent_manager.add_torrent(movie_file.magnet_link, movie_dir)
        handle = torrent_manager.get_handle(handle_id)
        
        if not handle: raise Exception("No torrent handle")

        # 2. WAIT FOR METADATA
        attempts = 0
        last_log = 0
        last_stats = {}
        while not handle.has_metadata():
            status = handle.status()
            seeds = getattr(status, 'num_seeds', 0)
            peers = getattr(status, 'num_peers', 0)
            down_kbps = (getattr(status, 'download_rate', 0) / 1000.0)
            last_stats = {"seeds": seeds, "peers": peers, "down_kbps": down_kbps}

            # Log once per second to observe swarm health
            now = time.time()
            if now - last_log >= 1:
                logger.info(
                    f"[metadata-wait] movie={movie_file.id} seeds={seeds} peers={peers} down={down_kbps:.1f} kB/s attempt={attempts}"
                )
                last_log = now

            if attempts > 120:
                logger.error(
                    f"Metadata timeout for movie={movie_file.id} seeds={seeds} peers={peers} down={down_kbps:.1f} kB/s"
                )
                raise Exception("Metadata timeout")
            time.sleep(1)
            attempts += 1

        info = handle.get_torrent_info()
        largest = max(info.files(), key=lambda f: f.size)
        file_path_in_torrent = largest.path
        downloaded_path = os.path.join(movie_dir, file_path_in_torrent)
        
        # Save relative path
        movie_file.file_path = os.path.relpath(downloaded_path, settings.MEDIA_ROOT)
        movie_file.save()

        handle.set_sequential_download(True)
        
        try:
            for i in range(min(20, info.num_pieces())): handle.piece_priority(i, 7)
        except: pass

        # 3. WAIT FOR HEADER (CRITICAL)
        if not wait_for_header(downloaded_path):
            raise Exception("File header missing (download stuck?)")

        service = VideoService()
        conversion_started = False
        current_segment = 0
        video_duration = None

        dl_last_log = 0
        while True:
            status = handle.status()
            progress = status.progress * 100
            movie_file.download_progress = progress
            # Periodic swarm stats to diagnose slowness (every ~2s)
            now = time.time()
            if now - dl_last_log >= 2:
                seeds = getattr(status, 'num_seeds', 0)
                peers = getattr(status, 'num_peers', 0)
                down_kbps = (getattr(status, 'download_rate', 0) / 1000.0)
                logger.info(
                    f"[dl] movie={movie_file.id} progress={progress:.2f}% seeds={seeds} peers={peers} down={down_kbps:.1f} kB/s"
                )
                dl_last_log = now
            
            if not conversion_started:
                dur = service.get_video_duration(downloaded_path)
                if dur:
                    video_duration = dur
                    conversion_started = True
                    movie_file.download_status = "DL_AND_CONVERT"
                    logger.info(f"Header ready. Duration: {dur}s")

            # B. Transcode Available Segments
            if conversion_started and video_duration:
                segment_end_time = (current_segment + 1) * service.segment_duration
                required_progress = (segment_end_time / video_duration) * 100
                
                # Buffer 5% to avoid "Invalid Data" crashes
                if progress >= (required_progress + 5) or status.is_seeding:
                    success = service.convert_all_segments(
                        downloaded_path, 
                        movie_dir, 
                        current_segment
                    )

                    if success:
                        if current_segment == 0:
                            movie_file.download_status = "PLAYABLE"
                            logger.info("First segment ready!")
                        
                        current_segment += 1
                        movie_file.save()
                    else:
                        time.sleep(2)

            if status.is_seeding or progress >= 100:
                break
            
            time.sleep(1)
            if int(time.time()) % 5 == 0: movie_file.save()

        if video_duration:
            total_segs = int(video_duration / service.segment_duration) + 1
            remaining = list(range(current_segment, total_segs))
            
            if remaining:
                logger.info(f"Batch processing {len(remaining)} segments with 4 threads...")
                with ThreadPoolExecutor(max_workers=4) as executor:
                    futures = [
                        executor.submit(service.convert_all_segments, downloaded_path, movie_dir, idx)
                        for idx in remaining
                    ]
                    for f in futures: f.result()

        # After progressive segments, produce finalized ABR playlists (industry-standard)
        try:
            service = VideoService()
            out_ok = service.transcode_to_hls(downloaded_path, movie_dir, segment_time=10)
            if out_ok:
                logger.info(f"Final HLS packaging complete for movie={video_id}")
            else:
                logger.warning(f"Final HLS packaging failed; continuing with progressive segments for movie={video_id}")
        except Exception as e:
            logger.warning(f"HLS packaging exception: {e}")

        movie_file.download_status = "READY"
        movie_file.save()
        logger.info(f"Processing complete for {video_id}")

    except Exception as e:
        # Log final swarm stats if available
        try:
            if 'handle' in locals() and handle and handle.is_valid():
                st = handle.status()
                seeds = getattr(st, 'num_seeds', 0)
                peers = getattr(st, 'num_peers', 0)
                down_kbps = (getattr(st, 'download_rate', 0) / 1000.0)
                logger.error(
                    f"Thread Error: {e} | final swarm movie={video_id} seeds={seeds} peers={peers} down={down_kbps:.1f} kB/s"
                )
            else:
                logger.error(f"Thread Error: {e} | no valid torrent handle for movie={video_id}")
        except Exception:
            logger.error(f"Thread Error: {e}")
        if movie_file:
            movie_file.download_status = "ERROR"
            movie_file.save()
            # Ensure we remove any lingering torrent handle
            try:
                handle_id = str(hash(movie_file.magnet_link)) if movie_file.magnet_link else None
                if handle_id:
                    torrent_manager.remove_torrent(handle_id)
                    logger.info(f"Removed torrent handle for movie={movie_file.id} after error")
            except Exception as re:
                logger.warning(f"Failed to remove torrent after error: {re}")

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
            # HEAD readiness probe: respond quickly if any variant folder has segments
            if request.method == 'HEAD':
                # If movie is in ERROR, signal to client
                if movie.download_status == 'ERROR':
                    return HttpResponse(status=410)  # Gone
                for r in ("1080p", "720p", "480p", "360p"):
                    rdir = os.path.join(base_dir, r)
                    if os.path.isdir(rdir):
                        try:
                            if any(name.startswith("segment_") and name.endswith(".ts") for name in os.listdir(rdir)):
                                return HttpResponse(status=200)
                        except Exception:
                            pass
                return HttpResponse(status=404)

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
            rdir = os.path.join(base_dir, r)
            if not os.path.isdir(rdir):
                continue
            static_pl = os.path.join(rdir, 'index.m3u8')
            has_static = os.path.exists(static_pl)
            has_segments = False
            try:
                has_segments = any(name.startswith('segment_') and name.endswith('.ts') for name in os.listdir(rdir))
            except Exception:
                has_segments = False
            if has_static or has_segments:
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

        # If a static playlist exists (from finalized HLS packaging), serve it with segment URIs rewritten
        static_pl = os.path.join(target_dir, 'index.m3u8')
        if os.path.exists(static_pl):
            try:
                lines = []
                with open(static_pl, 'r') as f:
                    for line in f.read().splitlines():
                        if not line or line.startswith('#'):
                            lines.append(line)
                        else:
                            # rewrite segment filename to our stream_ts route
                            seg = line.strip()
                            lines.append(f"/api/video/{pk}/stream_ts/?file={seg}&res={resolution}")
                return HttpResponse("\n".join(lines), content_type="application/vnd.apple.mpegurl")
            except Exception:
                pass

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
        seg_len = 10

        content = [
            "#EXTM3U",
            "#EXT-X-VERSION:3",
            f"#EXT-X-TARGETDURATION:{seg_len}",
            "#EXT-X-MEDIA-SEQUENCE:0",
            f"#EXT-X-PLAYLIST-TYPE:{pl_type}"
        ]

        for seg in segments:
            content.append(f"#EXTINF:{seg_len}.0,")
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

    @action(detail=True, methods=["get"], url_path="status")
    def status(self, request, pk=None):
        """
        Report current movie status with swarm info; optionally cleanup on error.
        Query param: cleanup=1 to remove torrent handle if status=ERROR.
        """
        try:
            movie = get_object_or_404(MovieFile, pk=pk)
            base_dir = os.path.join(settings.MEDIA_ROOT, 'movies', str(pk))
            handle = None
            seeds = peers = 0
            down_kbps = 0.0
            try:
                handle_id = str(hash(movie.magnet_link)) if movie.magnet_link else None
                if handle_id:
                    handle = torrent_manager.get_handle(handle_id)
                if handle and handle.is_valid():
                    st = handle.status()
                    seeds = getattr(st, 'num_seeds', 0)
                    peers = getattr(st, 'num_peers', 0)
                    down_kbps = round(getattr(st, 'download_rate', 0) / 1000.0, 1)
            except Exception:
                pass

            # Check variants readiness
            variants = {}
            for r in ("1080p", "720p", "480p", "360p"):
                rdir = os.path.join(base_dir, r)
                static_pl = os.path.join(rdir, 'index.m3u8')
                segs = 0
                try:
                    if os.path.isdir(rdir):
                        segs = sum(1 for name in os.listdir(rdir) if name.startswith('segment_') and name.endswith('.ts'))
                except Exception:
                    pass
                variants[r] = {
                    "static_playlist": os.path.exists(static_pl),
                    "segments": segs,
                }

            problem = None
            if movie.download_status == 'ERROR':
                problem = 'error'
            elif (seeds + peers) == 0 and not any(v.get('segments', 0) > 0 for v in variants.values()):
                problem = 'no-peers'

            # Optional cleanup on explicit request when in error
            if problem == 'error' and request.query_params.get('cleanup') == '1':
                try:
                    handle_id = str(hash(movie.magnet_link)) if movie.magnet_link else None
                    if handle_id:
                        torrent_manager.remove_torrent(handle_id)
                        logger.info(f"Cleanup: removed torrent handle for movie={movie.id}")
                except Exception as e:
                    logger.warning(f"Cleanup failed for movie={movie.id}: {e}")

            return Response({
                "id": movie.id,
                "status": movie.download_status,
                "progress": movie.download_progress,
                "swarm": {"seeds": seeds, "peers": peers, "down_kbps": down_kbps},
                "variants": variants,
                "problem": problem,
            }, status=status.HTTP_200_OK)

        except Http404:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"status endpoint error: {e}")
            return Response({"error": "Internal error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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