import os
import shutil
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from app.models import MovieFile

class Command(BaseCommand):
    help = 'Deletes movie files unwatched for 30 days'

    def handle(self, *args, **options):
        # 1. Calculate the cutoff date
        cutoff = timezone.now() - timedelta(days=30)
        
        # 2. Query the DB: "Give me movies older than cutoff AND that have files"
        # This is efficient; it pushes the filtering to the Database.
        expired_movies = MovieFile.objects.filter(
            last_watched__lt=cutoff,
            download_status='READY' # Only delete if it was actually downloaded
        )

        if not expired_movies.exists():
            self.stdout.write("No movies to clean up.")
            return

        self.stdout.write(f"Found {expired_movies.count()} expired movies.")

        for movie in expired_movies:
            self.delete_movie_content(movie)

    def delete_movie_content(self, movie):
        try:
            # 1. Delete the actual directory from disk
            if movie.file_path:
                full_path = os.path.join(settings.MEDIA_ROOT, movie.file_path)
                # Get the parent folder (the movie directory) to delete everything (subs, segments)
                movie_dir = os.path.dirname(full_path)
                
                if os.path.exists(movie_dir):
                    shutil.rmtree(movie_dir) # Nukes the whole folder
                    self.stdout.write(f"Deleted files for: {movie.id}")

            # 2. Reset the DB state (Soft Delete)
            movie.download_status = "PENDING"
            movie.download_progress = 0
            movie.file_path = None
            movie.magnet_link = movie.magnet_link # Keep the link so we can re-download!
            movie.save()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to delete {movie.id}: {e}"))