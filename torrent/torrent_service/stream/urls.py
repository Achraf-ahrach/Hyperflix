from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VideoViewSet, SubtitleViewSet

router = DefaultRouter()
router.register(r"video", VideoViewSet, basename="video")
router.register(r"subtitles", SubtitleViewSet, basename="subtitle")

urlpatterns = [
    path("", include(router.urls)),
]
