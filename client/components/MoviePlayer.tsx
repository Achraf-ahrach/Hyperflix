import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Button, IconButton, Slider } from '@mui/material';
import { PlayArrow, Pause, Fullscreen, Forward10, Replay10, Subtitles } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';


const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


// --- Interfaces ---
interface MovieStatus {
  ready: boolean;
  downloading: boolean;
  file_path: string;
  status?: string;
  progress?: number;
  total_duration?: number;
  segment_duration?: number;
  available_segments?: number;
}

interface SegmentInfo {
  segment: number;
  filename: string;
  size: number;
}

interface SegmentsData {
  available_segments: SegmentInfo[];
  segment_duration: number;
  total_segments: number;
  total_duration?: number;
}

interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleTrack {
  language: string;
  language_name: string;
  file_path: string;
}

// REMOVED 'magnet' from props, only needs the DB ID now
interface MoviePlayerComponentProps {
  movieId: number; 
}

const BUFFER_SEGMENTS = 2;

const MoviePlayer: React.FC<MoviePlayerComponentProps> = ({ movieId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setFilePath] = useState<string | null>(null);
  const [, setStatusData] = useState<MovieStatus | null>(null);
  const [retryCount] = useState(0);
  
  // Video elements
  const currentVideoRef = useRef<HTMLVideoElement>(null);
  const bufferVideoRefs = useRef<HTMLVideoElement[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // Time/Segments
  const [currentSegment, setCurrentSegment] = useState(0);
  const [segmentsData, setSegmentsData] = useState<SegmentsData | null>(null);
  const [virtualTime, setVirtualTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedSegments, setBufferedSegments] = useState<number[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // UI Controls
  const intervalRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const [availableTime, setAvailableTime] = useState(0);

  // Subtitles
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleTrack | null>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

  // --- Helper Functions (Time/VTT) ---
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseVTTTime = (timeString: string): number => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1] || '0');
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  };

  const parseVTTContent = (vttContent: string): SubtitleCue[] => {
    const lines = vttContent.split('\n');
    const cues: SubtitleCue[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes(' --> ')) {
        const [startTimeStr, endTimeStr] = line.split(' --> ');
        const startTime = parseVTTTime(startTimeStr.trim());
        const endTime = parseVTTTime(endTimeStr.trim());
        const textLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim());
          i++;
        }
        if (textLines.length > 0) {
          cues.push({ startTime, endTime, text: textLines.join('\n') });
        }
      }
    }
    return cues;
  };

  // --- Effects ---

  // Subtitle Text Update
  useEffect(() => {
    if (subtitleCues.length === 0) {
      setCurrentSubtitleText('');
      return;
    }
    const currentCue = subtitleCues.find(cue => 
      virtualTime >= cue.startTime && virtualTime <= cue.endTime
    );
    setCurrentSubtitleText(currentCue ? currentCue.text : '');
  }, [virtualTime, subtitleCues]);

  // Load Subtitle File
  useEffect(() => {
    if (!currentSubtitle) {
      setSubtitleCues([]);
      setCurrentSubtitleText('');
      return;
    }
    const loadSubtitleFile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/subtitles/${movieId}/file/${currentSubtitle.language}/`);
        if (response.ok) {
          const vttContent = await response.text();
          const cues = parseVTTContent(vttContent);
          setSubtitleCues(cues);
        }
      } catch (error) {
        console.error('Error loading subtitle file:', error);
        setSubtitleCues([]);
      }
    };
    loadSubtitleFile();
  }, [currentSubtitle, movieId]);

  // Init Buffer Videos
  useEffect(() => {
    bufferVideoRefs.current = Array(BUFFER_SEGMENTS).fill(null).map(() => {
      const video = document.createElement('video');
      video.style.display = 'none';
      return video;
    });
    return () => { bufferVideoRefs.current.forEach(video => video.remove()); };
  }, []);

  // Preloader
  const preloadSegments = useCallback((baseSegment: number, segData?: SegmentsData) => {
    const dataToUse = segData || segmentsData;
    if (!dataToUse) return;
    const segmentsToBuffer = Array.from({ length: BUFFER_SEGMENTS }, (_, i) => baseSegment + i + 1)
      .filter(seg => seg < dataToUse.total_segments);
    
    segmentsToBuffer.forEach((segment, index) => {
      const video = bufferVideoRefs.current[index];
      if (!video) return;
      video.src = '';
      video.load();
      video.src = `${API_BASE_URL}/video/${movieId}/stream/?segment=${segment}&t=${retryCount}`;
      video.load();
      video.oncanplaythrough = () => {
        setBufferedSegments(prev => !prev.includes(segment) ? [...prev, segment] : prev);
      };
    });
  }, [movieId, retryCount, segmentsData]);

  // Fetch Segment Map
  const fetchSegmentInfo = useCallback(async () => {
    try {
      const response = await api.get<SegmentsData>(`/video/${movieId}/segments/`);
      setSegmentsData(response.data);
      if (response.data.total_duration) setTotalDuration(response.data.total_duration);
      
      const lastAvailableSegment = Math.max(...response.data.available_segments.map((seg: any) => seg.segment));
      setAvailableTime((lastAvailableSegment + 1) * response.data.segment_duration);
      
      // Init first segment
      if (currentVideoRef.current && !currentVideoRef.current.src && response.data.available_segments.length > 0) {
        const firstSegmentSrc = `${API_BASE_URL}/video/${movieId}/stream/?segment=0&t=${retryCount}`;
        currentVideoRef.current.src = firstSegmentSrc;
        currentVideoRef.current.load();
        setCurrentSegment(0);
        currentVideoRef.current.addEventListener('loadeddata', () => {
          currentVideoRef.current?.play().catch(console.error);
          preloadSegments(0, response.data);
        }, { once: true });
      }
    } catch (err) {
      console.error('Failed to fetch segment info:', err);
    }
  }, [movieId, retryCount, preloadSegments]);

  // Check Status Poll
  const checkStatus = useCallback(async () => {
    try {
      const response = await api.get<MovieStatus>(`/video/${movieId}/status/`);
      setStatusData(response.data);
      
      if (response.data.total_duration) setTotalDuration(response.data.total_duration);
      
      if (response.data.status === 'READY' || response.data.status === 'PLAYABLE' || response.data.ready) {
        setFilePath(response.data.file_path);
        setLoading(false);
        fetchSegmentInfo();
      } 
      // Note: We removed the auto-POST to start download here. 
      // We assume App.tsx already started it. We just wait for status to become READY/PLAYABLE.
      
    } catch (err) {
      setError(`Failed to check movie status: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [movieId, fetchSegmentInfo]);

  // Segment Switching
  const switchToSegment = useCallback((targetSegment: number, seekTime?: number) => {
    if (!currentVideoRef.current || !segmentsData || isTransitioning) return;
    setIsTransitioning(true);
    setIsBuffering(true);
      
    const newSrc = `${API_BASE_URL}/video/${movieId}/stream/?segment=${targetSegment}&t=${retryCount}`;
    const wasPlaying = !currentVideoRef.current.paused;
      
    currentVideoRef.current.style.opacity = '0.8';
    currentVideoRef.current.src = newSrc;
      
    const handleLoadedData = () => {
      if (currentVideoRef.current) {
        if (seekTime !== undefined) currentVideoRef.current.currentTime = seekTime;
        currentVideoRef.current.style.opacity = '1';
        setIsTransitioning(false);
        setIsBuffering(false);
        if (wasPlaying) currentVideoRef.current.play().catch(console.error);
        preloadSegments(targetSegment);
      }
    };
    currentVideoRef.current.addEventListener('loadeddata', handleLoadedData, { once: true });
    setCurrentSegment(targetSegment);
  }, [movieId, retryCount, segmentsData, isTransitioning, preloadSegments]);

  // Seeking Logic
  const isTimeAvailable = useCallback((time: number) => time <= availableTime, [availableTime]);

  const handleSeek = useCallback((newTime: number) => {
    if (!segmentsData || !isTimeAvailable(newTime)) return;
    const targetSegment = Math.floor(newTime / segmentsData.segment_duration);
    const segmentTime = newTime % segmentsData.segment_duration;
    setVirtualTime(newTime);
    if (targetSegment !== currentSegment) {
      switchToSegment(targetSegment, segmentTime);
    } else if (currentVideoRef.current) {
      currentVideoRef.current.currentTime = segmentTime;
    }
  }, [segmentsData, currentSegment, switchToSegment, isTimeAvailable]);

  // Controls
  const skipForward = () => handleSeek(Math.min(virtualTime + 10, totalDuration));
  const skipBackward = () => handleSeek(Math.max(virtualTime - 10, 0));
  const togglePlayPause = () => {
    if (!currentVideoRef.current) return;
    isPlaying ? currentVideoRef.current.pause() : currentVideoRef.current.play();
  };
  const enterFullscreen = () => {
    if (currentVideoRef.current?.requestFullscreen) currentVideoRef.current.requestFullscreen();
  };

  // Poll Interval
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
      if (segmentsData) fetchSegmentInfo();
    }, 5000); // Poll every 5 seconds
    checkStatus();
    return () => clearInterval(interval);
  }, [checkStatus, fetchSegmentInfo, segmentsData]);

  // Time Update Loop
  useEffect(() => {
    const updateTime = () => {
      if (!currentVideoRef.current || !segmentsData || isDragging || isTransitioning) return;
      const segmentTime = currentVideoRef.current.currentTime;
      const baseTime = currentSegment * segmentsData.segment_duration;
      const newVirtualTime = baseTime + segmentTime;
      setVirtualTime(newVirtualTime);
      if (segmentTime >= segmentsData.segment_duration - 0.5) {
        const nextSegment = currentSegment + 1;
        if (nextSegment < segmentsData.total_segments && bufferedSegments.includes(nextSegment)) {
          switchToSegment(nextSegment);
        }
      }
    };
    if (isPlaying) {
      intervalRef.current = window.setInterval(updateTime, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, currentSegment, segmentsData, isDragging, isTransitioning, bufferedSegments, switchToSegment]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowLeft': e.preventDefault(); skipBackward(); break;
        case 'ArrowRight': e.preventDefault(); skipForward(); break;
        case 'KeyF': e.preventDefault(); enterFullscreen(); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [virtualTime]);

  // Controls visibility
  useEffect(() => {
    const hideControlsTimeout = () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (isPlaying && !isDragging) setShowControls(false);
      }, 3000);
    };
    hideControlsTimeout();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [isPlaying, isDragging]);
  
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !isDragging) setShowControls(false);
    }, 3000);
  };

  // Initial Subtitles Fetch
  useEffect(() => {
    const fetchSubtitles = async () => {
      try {
        const response = await api.get(`/subtitles/?movie_id=${movieId}&language=en`);
        setSubtitles(response.data);
      } catch (error) { console.error('Error fetching subtitles:', error); }
    };
    fetchSubtitles();
  }, [movieId]);

  // Subtitle Toggle
  useEffect(() => {
    if (subtitlesEnabled) {
      if (subtitles.length > 0) setCurrentSubtitle(subtitles[0]);
    } else {
      setCurrentSubtitle(null);
    }
  }, [subtitlesEnabled, subtitles]);

  // Unmute on click
  useEffect(() => {
    const handleDocumentClick = () => {
      if (isMuted && currentVideoRef.current) {
        currentVideoRef.current.muted = false;
        setIsMuted(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [isMuted]);

  // RENDER
  if (loading) {
    return <Box sx={moviePlayerStyles.loadingContainer}><CircularProgress size={60} thickness={3} sx={{ color: '#ff0000' }} /></Box>;
  }

  if (error) {
    return (
      <Box sx={moviePlayerStyles.errorContainer}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" color="primary" onClick={() => { setError(null); setLoading(true); checkStatus(); }}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box sx={moviePlayerStyles.videoContainer} onMouseMove={handleMouseMove} onMouseEnter={() => setShowControls(true)}>
      <Box sx={{ position: 'relative', width: '100%', height: 0, paddingBottom: '56.25%', backgroundColor: '#000' }}>
        <video
          ref={currentVideoRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onError={(e) => { console.error('Video error:', e); setError('Failed to load video segment'); }}
          playsInline preload="auto" crossOrigin="anonymous" muted={isMuted}
        />
        
        {/* Subtitles Overlay */}
        {currentSubtitleText && (
          <Box sx={{
            position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', padding: '8px 16px',
            borderRadius: '4px', fontSize: '18px', fontWeight: 500, textAlign: 'center',
            maxWidth: '80%', lineHeight: 1.4, whiteSpace: 'pre-line',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)', zIndex: 10,
          }}>
            {currentSubtitleText}
          </Box>
        )}
        
        {/* Buffering */}
        {isBuffering && <Box sx={moviePlayerStyles.bufferingOverlay}><CircularProgress size={40} sx={{ color: 'white' }} /></Box>}
        
        {/* Controls */}
        <Box sx={{ ...moviePlayerStyles.controlsOverlay, opacity: showControls ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          <Box sx={moviePlayerStyles.progressBarContainer}>
            <Box sx={{ position: 'relative', height: 4, backgroundColor: '#333', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(availableTime / totalDuration) * 100}%`, backgroundColor: '#666', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(virtualTime / totalDuration) * 100}%`, backgroundColor: '#ff0000', pointerEvents: 'none' }} />
              <Slider
                value={virtualTime} min={0} max={totalDuration}
                onChange={(_, val:any) => { const t = val as number; if (isTimeAvailable(t)) { setVirtualTime(t); setIsDragging(true); } }}
                onChangeCommitted={(_, val:any) => { const t = val as number; if (isTimeAvailable(t)) handleSeek(t); setIsDragging(false); }}
                sx={{
                  ...moviePlayerStyles.progressSlider, position: 'absolute', padding: 0, width: '100%', top: '50%', transform: 'translateY(-50%)',
                  '& .MuiSlider-rail': { opacity: 0, backgroundColor: 'transparent' },
                  '& .MuiSlider-track': { opacity: 0, backgroundColor: 'transparent' },
                  '& .MuiSlider-thumb': { display: isDragging ? 'block' : 'none', '&:hover': { display: 'block' } },
                  '&:hover .MuiSlider-thumb': { display: 'block' },
                }}
              />
            </Box>
          </Box>
          
          <Box sx={moviePlayerStyles.controlsContainer}>
            <Box sx={moviePlayerStyles.leftControls}>
              <IconButton onClick={togglePlayPause} sx={moviePlayerStyles.controlButton}>{isPlaying ? <Pause /> : <PlayArrow />}</IconButton>
              <IconButton onClick={skipBackward} sx={moviePlayerStyles.controlButton}><Replay10 /></IconButton>
              <IconButton onClick={skipForward} sx={moviePlayerStyles.controlButton}><Forward10 /></IconButton>
              <IconButton onClick={() => setSubtitlesEnabled(!subtitlesEnabled)} sx={{ ...moviePlayerStyles.controlButton, color: subtitlesEnabled ? 'white' : 'rgba(255, 255, 255, 0.4)' }}><Subtitles /></IconButton>
              <Typography variant="body2" sx={moviePlayerStyles.timeDisplay}>{formatTime(virtualTime)} / {formatTime(totalDuration)}</Typography>
            </Box>
            <Box sx={moviePlayerStyles.rightControls}>
              <IconButton onClick={enterFullscreen} sx={moviePlayerStyles.controlButton}><Fullscreen /></IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MoviePlayer;








// Basic styles to prevent crashes
const moviePlayerStyles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '400px',
    bgcolor: '#000',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '400px',
    bgcolor: '#000',
    gap: 2,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    bgcolor: '#000',
    overflow: 'hidden',
    borderRadius: '8px',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
    padding: '20px',
    zIndex: 2,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
  },
  progressBarContainer: {
    marginBottom: '10px',
    padding: '0 10px',
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
  },
  controlButton: {
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  timeDisplay: {
    color: 'white',
    ml: 2,
    fontSize: '0.875rem',
  },
  progressSlider: {
    color: '#ff0000',
    height: 4,
    '& .MuiSlider-thumb': {
      width: 12,
      height: 12,
      transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
      '&:before': {
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
      },
      '&:hover, &.Mui-focusVisible': {
        boxShadow: '0px 0px 0px 8px rgba(255, 0, 0, 0.16)',
      },
      '&.Mui-active': {
        width: 16,
        height: 16,
      },
    },
  }
};