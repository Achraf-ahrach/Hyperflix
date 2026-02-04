import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

const API_HOST = process.env.REACT_APP_STREAMING_API_URL || 'http://localhost:8001';
const API_BASE_URL = `${API_HOST}/api`;
const API_URL = API_BASE_URL;

interface VideoPlayerProps {
    movieId: number;
}

interface Subtitle {
    language: string;
    language_name: string; // The backend now sends 'label' or 'language_name'. Adjust based on exact backend response.
    label?: string;        // Handle both keys just in case
    file_path: string;
    src?: string;          // Handle both keys
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movieId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // Status indicators
    const [isPlaylistReady, setIsPlaylistReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Initializing...");
    
    // Preference state (doesn't trigger API calls, just UI selection)
    const [userLanguage, setUserLanguage] = useState('en'); 

    // 1. Unified Fetch Logic
    useEffect(() => {
        let isMounted = true;
        
        // --- A. Fetch Subtitles (Once) ---
        // Backend now handles downloading ALL languages in one go.
        // We don't need to poll aggressively unless the backend is async (non-blocking).
        // Assuming your backend "fetch_all_subtitles" blocks until done:
        const fetchSubtitles = async () => {
            if (!isMounted) return;
            try {
                // CHANGED: Removed language param. We want everything.
                const subtitleUrl = `${API_URL}/subtitles/?movie_id=${movieId}`;
                const res = await axios.get(subtitleUrl);
                
                if (isMounted && Array.isArray(res.data)) {
                    console.log("Subtitles loaded:", res.data);
                    setSubtitles(res.data);
                }
            } catch (err: any) {
                console.warn("Could not fetch subtitles (might be empty or failed):", err);
                // We don't set a critical error here because the video can still play without subs.
            }
        };

        // --- B. Poll for Playlist (Video File) ---
        const waitForPlaylist = async (attempt = 1) => {
            if (!isMounted) return;
            try {
                setStatusMessage(`Checking for video file (Attempt ${attempt})...`);
                
                // HEAD request to check availability
                await axios.head(`${API_URL}/video/${movieId}/playlist/`);
                
                if (isMounted) {
                    setIsPlaylistReady(true); 
                    setStatusMessage("Video found! Starting player...");
                }
            } catch (err: any) {
                // If 404/503, retry.
                if (isMounted && (err.response?.status === 404 || err.response?.status === 503)) {
                    // Stop retrying after ~60 seconds to avoid infinite loops
                    if (attempt < 30) {
                        setTimeout(() => waitForPlaylist(attempt + 1), 2000);
                    } else {
                        setError("Timeout: Video generation took too long.");
                    }
                } else if (isMounted) {
                    setError("Network Error: Could not reach video server.");
                }
            }
        };

        // Reset state on movie change
        setSubtitles([]);
        setIsPlaylistReady(false);
        setError(null);
        
        // Trigger
        fetchSubtitles();
        waitForPlaylist();

        return () => { isMounted = false; };
    }, [movieId]); // CHANGED: Removed userLanguage dependency

    // 2. Initialize HLS
    useEffect(() => {
        if (!isPlaylistReady || !videoRef.current) return;

        const video = videoRef.current;
        const hlsUrl = `${API_URL}/video/${movieId}/playlist/`;
        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls({
                debug: false,
                manifestLoadingTimeOut: 20000, 
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.log("Autoplay blocked by browser:", e));
                }
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
            
            {/* Loading Overlay */}
            {!isPlaylistReady && (
                <Box sx={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.8)', zIndex: 10 
                }}>
                    <CircularProgress color="secondary" />
                    <Typography sx={{ mt: 2, color: 'white' }}>
                        {statusMessage}
                    </Typography>
                </Box>
            )}

            <video 
                ref={videoRef} 
                controls 
                style={{ width: '100%', aspectRatio: '16/9', display: 'block' }}
                crossOrigin="anonymous"
            >
                {/* Dynamic Subtitle Rendering 
                   The browser's native player will pick up these tracks.
                   Because we return ALL languages, the user will see a menu 
                   (CC button) with "English", "French", etc.
                */}
                {subtitles.map((sub) => {
                    // Handle inconsistencies in backend naming if necessary
                    const label = sub.label || sub.language_name || sub.language.toUpperCase();
                    const src = sub.src || sub.file_path;
                    const finalSrc = src.startsWith('http') ? src : `${API_HOST}${src}`;

                    return (
                        <track
                            key={sub.language}
                            kind="subtitles"
                            label={label}
                            srcLang={sub.language}
                            src={finalSrc}
                            // Only set default if it matches user preference
                            default={sub.language === userLanguage} 
                        />
                    );
                })}
            </video>
        </Box>
    );
};

export default VideoPlayer;