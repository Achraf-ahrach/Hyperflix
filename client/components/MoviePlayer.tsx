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
    language_name: string;
    file_path: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movieId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // Status indicators
    const [isPlaylistReady, setIsPlaylistReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Initializing...");
    const [userLanguage, setUserLanguage] = useState('en'); // Example default

    // 1. Unified "Wait for Everything" Logic
    useEffect(() => {
        let isMounted = true;
        
        // --- A. Poll for Subtitles ---
        const waitForSubtitles = async (attempt = 1) => {
            if (!isMounted) return;
            try {
                const subtitleUrl = `${API_URL}/subtitles/?movie_id=${movieId}&language=${userLanguage}`;
                const res = await axios.get(subtitleUrl);
                if (isMounted) setSubtitles(res.data);
            } catch (err: any) {
                if (isMounted && (err.response?.status === 404 || err.response?.status === 503)) {
                    if (attempt < 200) setTimeout(() => waitForSubtitles(attempt + 1), 3000);
                }
            }
        };

        // --- B. Poll for Playlist (THE FIX) ---
        const waitForPlaylist = async (attempt = 1) => {
            if (!isMounted) return;
            try {
                setStatusMessage(`Checking for video file (Attempt ${attempt})...`);
                
                // We use HEAD to be lightweight, just checking if it exists
                await axios.head(`${API_URL}/video/${movieId}/playlist/`);
                
                // If we get here, it means 200 OK. The file is ready!
                if (isMounted) {
                    setIsPlaylistReady(true); 
                    setStatusMessage("Video found! Starting player...");
                }
            } catch (err: any) {
                // If 404 (Not Found) or 503 (Not Ready)
                if (isMounted && (err.response?.status === 404 || err.response?.status === 503)) {
                    console.log(`Playlist 404. Retrying in 2s... (Attempt ${attempt})`);
                    setTimeout(() => waitForPlaylist(attempt + 1), 2000);
                } else if (isMounted) {
                    // Actual server error (500) or network down
                    setError("Network Error: Could not reach server.");
                }
            }
        };

        // Start both loops in parallel
        setSubtitles([]);
        setIsPlaylistReady(false);
        waitForSubtitles();
        waitForPlaylist();

        return () => { isMounted = false; };
    }, [movieId, userLanguage]);

    // 2. Initialize HLS (Only runs AFTER playlist is confirmed ready)
    useEffect(() => {
        if (!isPlaylistReady || !videoRef.current) return;

        const video = videoRef.current;
        const hlsUrl = `${API_URL}/video/${movieId}/playlist/`;
        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls({
                debug: false,
                // We don't need aggressive retry logic here anymore 
                // because we already confirmed the file exists above!
                manifestLoadingTimeOut: 20000, 
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.log("Autoplay blocked:", e));
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                   // Standard error recovery
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
            // Safari support
            video.src = hlsUrl;
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [isPlaylistReady, movieId]); // Dependencies ensure this runs only when ready

    if (error) return (
        <Box sx={{ p: 2, bgcolor: '#330000', color: 'white', borderRadius: 2 }}>
            <Typography variant="h6">Error</Typography>
            <Typography>{error}</Typography>
        </Box>
    );

    return (
        <Box sx={{ width: '100%', position: 'relative', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
            
            {/* Show Overlay if Playlist is NOT ready yet */}
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
                {subtitles.map((sub) => (
                    <track
                        key={sub.language}
                        kind="subtitles"
                        label={sub.language_name}
                        srcLang={sub.language}
                        src={sub.file_path.startsWith('http') ? sub.file_path : `${API_HOST}${sub.file_path}`}
                        default={sub.language === userLanguage}
                    />
                ))}
            </video>
        </Box>
    );
};

export default VideoPlayer;