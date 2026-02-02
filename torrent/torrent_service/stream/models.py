from django.db import models
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
import os


class MovieFile(models.Model):
	"""Model for movie file and streaming information"""
	id = models.BigAutoField(primary_key=True)
	imdb_id = models.CharField(max_length=20, null=True, blank=True)
	magnet_link = models.TextField()
	file_path = models.CharField(max_length=1000, null=True, blank=True)
	download_status = models.CharField(
		max_length=20,
		choices=[
			("PENDING", "Pending"),
			("DOWNLOADING", "Downloading"),
			("READY", "Ready"),
			("ERROR", "Error"),
			("CONVERTING", "Converting"),
		],
		default="PENDING",
	)
	download_progress = models.FloatField(default=0)
	last_watched = models.DateTimeField(default=timezone.now)
	created_at = models.DateTimeField(auto_now_add=True)
	
	def update_last_watched(self):
		"""Call this whenever the user plays the video"""
		self.last_watched = timezone.now()
		self.save(update_fields=['last_watched'])

	def save(self, *args, **kwargs):
		super().save(*args, **kwargs)
