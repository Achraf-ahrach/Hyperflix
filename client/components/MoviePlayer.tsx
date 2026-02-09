import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

const API_HOST = process.env.REACT_APP_STREAMING_API_URL || 'http://localhost:8001';
const API_BASE_URL = `${API_HOST}/api`;

interface VideoPlayerProps {
    movieId: number;
}

interface Subtitle {
    language: string;
    language_name: string;
    label?: string;
    file_path: string;
    src?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movieId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPlaylistReady, setIsPlaylistReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Initializing...");
    const [userLanguage, setUserLanguage] = useState('en');

    useEffect(() => {
        let isMounted = true;
        
        const fetchSubtitles = async () => {
            if (!isMounted) return;
            try {
                const subtitleUrl = `${API_BASE_URL}/subtitles/?movie_id=${movieId}`;
                const res = await axios.get(subtitleUrl);
                
                if (isMounted && Array.isArray(res.data)) {
                    setSubtitles(res.data);
                }
            } catch (err) {
                // Silent fail for subtitles
            }
        };

        const waitForPlaylist = async (attempt = 1) => {
            if (!isMounted) return;
            try {
                setStatusMessage(`Checking for video file (Attempt ${attempt})...`);
                await axios.head(`${API_BASE_URL}/video/${movieId}/playlist/`);
                
                if (isMounted) {
                    setIsPlaylistReady(true); 
                    setStatusMessage("Video found! Starting player...");
                }
            } catch (err: any) {
                if (isMounted && (err.response?.status === 404 || err.response?.status === 503)) {
                    if (attempt < 120) {
                        setTimeout(() => waitForPlaylist(attempt + 1), 2000);
                    } else {
                        setError("Timeout: Video generation took too long.");
                    }
                } else if (isMounted) {
                    setError("Network Error: Could not reach video server.");
                }
            }
        };

        setSubtitles([]);
        setIsPlaylistReady(false);
        setError(null);
        
        fetchSubtitles();
        waitForPlaylist();

        return () => { isMounted = false; };
    }, [movieId]);

    useEffect(() => {
        if (!isPlaylistReady || !videoRef.current) return;

        const video = videoRef.current;
        const hlsUrl = `${API_BASE_URL}/video/${movieId}/playlist/`;
        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls({
                debug: false,
                manifestLoadingTimeOut: 20000,
                // SOLUTION: Force start at 0 seconds
                startPosition: 0 
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // SOLUTION: Double ensure time is 0 before playing
                video.currentTime = 0; 
                video.play().catch(() => {});
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls?.startLoad(); 
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls?.recoverMediaError();
                            break;
                        default:
                            hls?.destroy();
                            setError("Playback Error: " + data.details);
                            break;
                    }
                }
            });
        } 
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl;
            // SOLUTION: For Safari (native HLS), force time to 0
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = 0;
                video.play();
            }, { once: true });
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [isPlaylistReady, movieId]);

    if (error) return (
        <Box sx={{ p: 2, bgcolor: '#330000', color: 'white', borderRadius: 2 }}>
            <Typography variant="h6">Error</Typography>
            <Typography>{error}</Typography>
        </Box>
    );

    return (
        <Box sx={{ width: '100%', position: 'relative', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
            {!isPlaylistReady && (
                <Box sx={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.8)', zIndex: 10 
                }}>
                    <CircularProgress color="secondary" />
                    <Typography sx={{ mt: 2, color: 'white' }}>{statusMessage}</Typography>
                </Box>
            )}

            <video 
                ref={videoRef} 
                controls 
                style={{ width: '100%', aspectRatio: '16/9', display: 'block' }}
                crossOrigin="anonymous"
            >
                {subtitles.map((sub, index) => {
                    const label = sub.label || sub.language_name || sub.language.toUpperCase();
                    const rawSrc = sub.src || sub.file_path;
                    const finalSrc = rawSrc.startsWith('http') ? rawSrc : `${API_HOST}${rawSrc}`;

                    return (
                        <track
                            key={sub.file_path || index}
                            kind="subtitles"
                            label={label}
                            srcLang={sub.language}
                            src={finalSrc}
                            default={sub.language === userLanguage} 
                        />
                    );
                })}
            </video>
        </Box>
    );
};

export default VideoPlayer;