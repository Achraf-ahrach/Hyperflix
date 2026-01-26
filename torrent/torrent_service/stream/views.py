
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
from .models import MovieFile
from rest_framework.pagination import PageNumberPagination
from .services import SubtitleService
from .utils import get_trackers, make_magnet_link
from django.conf import settings
from django.http import Http404, HttpResponse
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

        # Create standardized movie directory
        downloads_dir = "/app/downloads"
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
            
            # Store the full relative path including any subdirectories
            movie_file.file_path = os.path.join("movies", str(movie_file.id), file_path_in_torrent)
            movie_file.save()

            # Ensure the full directory structure exists
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
                movie_file.download_progress = progress
                
                # Try to start segmentation as soon as possible
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
                                logging.info(f"Starting segmentation at {progress:.2f}% for {file_path_in_torrent}")
                        except Exception as e:
                            logging.debug(f"File not ready yet: {e}")

                if conversion_started and video_duration:
                    segment_start_time = current_segment * video_service.segment_duration
                    required_progress = (segment_start_time + video_service.segment_duration) / video_duration * 100
                    required_progress = min(required_progress + 5, 100)  # Small buffer for safety

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
                                        # Get the directory structure from the original file path
                                        rel_path = os.path.relpath(downloaded_path, movie_dir)
                                        dir_path = os.path.dirname(rel_path)
                                        base_name = os.path.splitext(os.path.basename(rel_path))[0]
                                        
                                        # Create segment path preserving directory structure
                                        first_segment = f"{base_name}_segment_000.mp4"
                                        if dir_path:
                                            first_segment = os.path.join(dir_path, first_segment)
                                        
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
                logging.info(f"Download progress: {progress:.2f}%")

                if status.is_seeding:
                    break

                time.sleep(1)

            # Process remaining segments after download is complete
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
                    time.sleep(1)

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
    POST /video/{imdb}/start - Start movie download and processing data: {magnet_link, imdb_id}
    GET /video/:id/status - Get movie streaming status
    GET /video/:id/stream - Stream movie content
    """


    @action(detail=True, methods=["post"], url_path="start")
    def start_stream(self, request, pk=None):
        """Start movie download and processing"""
        magnet_link = request.data.get("magnet_link")
        if not magnet_link:
            return Response({"error": "Magnet link is required"}, status=status.HTTP_400_BAD_REQUEST)
        magnet_link = make_magnet_link(magnet_link)
        imdb_id = request.data.get("imdb_id")
        if not imdb_id:
            return Response({"error": "IMDB ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create or get existing movie file
        movie_file, created = MovieFile.objects.get_or_create(
            imdb_id=imdb_id, defaults={"magnet_link": magnet_link, "download_status": "PENDING", "download_progress": 0}
        )

        # If already processing or ready, return current status
        if movie_file.download_status in ["DOWNLOADING", "CONVERTING", "READY"]:
            return Response({"status": movie_file.download_status, "progress": movie_file.download_progress, "id": movie_file.id})

        # Start processing in background thread
        thread = threading.Thread(target=process_video_thread, args=(movie_file.id,))
        thread.daemon = True
        thread.start()

        return Response({"status": "PENDING", "id": movie_file.id, "imdb_id": movie_file.imdb_id})

    @action(detail=True, methods=["get"], url_path="status")
    def status(self, request, pk=None):
        """Get movie streaming status"""
        try:
            movie_file = MovieFile.objects.get(id=pk)
            
            response_data = {
                "status": movie_file.download_status,
                "progress": movie_file.download_progress,
                "file_path": movie_file.file_path,
                "ready": movie_file.download_status in ["READY", "PLAYABLE"],
                "downloading": movie_file.download_status in ["DOWNLOADING", "DL_AND_CONVERT"]
            }
            
            # If movie is playable or ready, add segment information and total duration
            if movie_file.download_status in ["READY", "PLAYABLE"]:
                try:
                    # Get the full path from the stored file path
                    file_path = os.path.join("/app/downloads", movie_file.file_path)
                    dir_path = os.path.dirname(file_path)
                    base_name = os.path.splitext(os.path.basename(file_path))[0]
                    
                    # Remove _segment_000 suffix if it exists
                    if base_name.endswith("_segment_000"):
                        base_name = base_name[:-12]
                    
                    # Get total movie duration from original file
                    original_file_path = None
                    for ext in ['.mkv', '.mp4', '.avi']:
                        test_path = os.path.join(dir_path, f"{base_name}{ext}")
                        if os.path.exists(test_path):
                            original_file_path = test_path
                            break
                    
                    total_duration = None
                    if original_file_path:
                        video_service = VideoService()
                        total_duration = video_service.get_video_duration(original_file_path)
                    
                    # Count available segments
                    available_segments = 0
                    while True:
                        segment_filename = f"{base_name}_segment_{available_segments:03d}.mp4"
                        segment_path = os.path.join(dir_path, segment_filename)
                        if os.path.exists(segment_path):
                            available_segments += 1
                        else:
                            break
                    
                    response_data["available_segments"] = available_segments
                    response_data["total_duration"] = total_duration
                    response_data["segment_duration"] = VideoService().segment_duration
                except Exception as e:
                    logging.error(f"Error counting segments: {e}")
            
            return Response(response_data)
        except MovieFile.DoesNotExist:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["get"], url_path="stream")
    def stream(self, request, pk=None):
        """Stream movie content"""
        try:
            movie_file = MovieFile.objects.get(id=pk)

            if movie_file.download_status not in ["READY", "PLAYABLE"]:
                return Response(
                    {"error": f"Movie is not ready for streaming (status: {movie_file.download_status})"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get segment parameter (default to 0 for first segment)
            segment = int(request.query_params.get("segment", 0))
            
            # Get the full path structure from the stored file path
            file_path = os.path.join("/app/downloads", movie_file.file_path)
            
            if segment != 0:  # For segments other than 0, we need to construct the segment path
                dir_path = os.path.dirname(file_path)
                base_name = os.path.splitext(os.path.basename(file_path))[0]
                
                if base_name.endswith("_segment_000"):
                    base_name = base_name[:-12]
                
                segment_filename = f"{base_name}_segment_{segment:03d}.mp4"
                file_path = os.path.join(dir_path, segment_filename)
            
            if not os.path.exists(file_path):
                return Response({"error": f"Segment {segment} not found"}, status=status.HTTP_404_NOT_FOUND)

            video_service = VideoService()

            range_header = request.META.get("HTTP_RANGE", "").strip()
            start_time = float(request.query_params.get("start", 0))

            response = video_service.stream_video(
                file_path=file_path,
                range_header=range_header,
                start_time=start_time
            )

            return response

        except MovieFile.DoesNotExist:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["get"], url_path="segments")
    def segments(self, request, pk=None):
        """Get segment information for the movie"""
        try:
            movie_file = MovieFile.objects.get(id=pk)
            
            if movie_file.download_status not in ["READY", "PLAYABLE"]:
                return Response(
                    {"error": f"Movie is not ready (status: {movie_file.download_status})"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Get the full path from the stored file path
            file_path = os.path.join("/app/downloads", movie_file.file_path)
            dir_path = os.path.dirname(file_path)
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            
            # Remove _segment_000 suffix if it exists
            if base_name.endswith("_segment_000"):
                base_name = base_name[:-12]
            
            # Get total movie duration from original file
            original_file_path = None
            for ext in ['.mkv', '.mp4', '.avi']:
                test_path = os.path.join(dir_path, f"{base_name}{ext}")
                if os.path.exists(test_path):
                    original_file_path = test_path
                    break
            
            total_duration = None
            if original_file_path:
                video_service = VideoService()
                total_duration = video_service.get_video_duration(original_file_path)
            
            # Find all available segments
            available_segments = []
            segment_num = 0
            
            while True:
                segment_filename = f"{base_name}_segment_{segment_num:03d}.mp4"
                segment_path = os.path.join(dir_path, segment_filename)
                
                if os.path.exists(segment_path):
                    available_segments.append({
                        "segment": segment_num,
                        "filename": segment_filename,
                        "size": os.path.getsize(segment_path)
                    })
                    segment_num += 1
                else:
                    break
            
            video_service = VideoService()
            segment_duration = video_service.segment_duration
            
            return Response({
                "available_segments": available_segments,
                "segment_duration": segment_duration,
                "total_segments": len(available_segments),
                "total_duration": total_duration
            })
            
        except MovieFile.DoesNotExist:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Segments info error: {str(e)}")
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ++++++++++++++++++++++++++++++++++++++++++++++++
# subtitle view


class SubtitleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for subtitles operations.
    GET /subtitles - Get available subtitles with the movie id and language
    GET /subtitles/{movie_id}/file/{language}/ - Serve the subtitle VTT file
    """

    subtitle_service = SubtitleService()

    def get_subtitles(self, movie: MovieFile, languages: list = ['en', 'fr']) -> list:
        """
        Checks if VTT files exist locally. If not, downloads them.
        Returns a list of dictionaries with 'lang' and 'url' for the frontend.
        """
        subtitle_data = []
        
        base_sub_dir = os.path.join(settings.MEDIA_ROOT, '/downloads/subtitles', str(movie.id))
        
        for lang in languages:
            vtt_filename = f"{lang}.vtt"
            local_path = os.path.join(base_sub_dir, vtt_filename)
            
            if os.path.exists(local_path):
                url = os.path.join(settings.MEDIA_URL, 'subtitles', str(movie.id), vtt_filename)
                subtitle_data.append({
                    'lang': lang,
                    'label': 'English' if lang == 'en' else lang.upper(),
                    'file_path': url
                })
            else:
                return None

        return subtitle_data

    def list(self, request):
        """
        Get subtitles for a specific movie in the user's preferred language.
        Returns a list of subtitle URLs and metadata.
        If the movie is not found (not yet downloaded), returns an empty list.
        """
        movie_id = request.query_params.get("movie_id")
        language = request.query_params.get("language", "en")

        if not movie_id:
            return Response({"error": "movie_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            movie = MovieFile.objects.get(id=movie_id)
        except MovieFile.DoesNotExist:
            return Response([], status=status.HTTP_200_OK) 

        if_local = self.get_subtitles(movie, language)
        if if_local:
            return Response(subtitles)
        subtitles = self.subtitle_service.fetch_subtitles(movie, language)
        return Response(subtitles)

    @action(detail=False, methods=['get'], url_path=r'(?P<movie_id>\d+)/file/(?P<language>\w+)')
    def serve_file(self, request, movie_id=None, language=None):
        """
        Serve the subtitle VTT file for a specific movie and language.
        """
        if not movie_id or not language:
            raise Http404("Movie ID and language are required")

        # Construct the file path
        file_path = os.path.join(settings.MEDIA_ROOT, 'downloads', 'subtitles', movie_id, f'{language}.vtt')
        
        if not os.path.exists(file_path):
            raise Http404("Subtitle file not found")

        try:
            with open(file_path, 'r', encoding='utf-8') as subtitle_file:
                content = subtitle_file.read()
            sys.stdout.write(file_path + "\n")
            sys.stdout.flush()
            response = HttpResponse(content, content_type='text/vtt')
            response['Content-Disposition'] = f'inline; filename="{language}.vtt"'
            return response
        except Exception as e:
            raise Http404(f"Error serving subtitle file: {str(e)}")
