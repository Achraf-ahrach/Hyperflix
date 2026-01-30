import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Box, Typography } from '@mui/material';
// import { api, API_URL } from './api/axiosConfig';


import axios from 'axios';

// Matches your Nginx /api/ proxy setup

const API_BASE_URL = (process.env.STREAMING_API_URL || 'http://localhost:8001') + '/api';
const API_URL = API_BASE_URL;

 const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

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

    // 1. Fetch Subtitles
    useEffect(() => {
        api.get(`/subtitles/?movie_id=${movieId}&language=fr`)
           .then(res => setSubtitles(res.data))
           .catch(err => console.error("Subtitle load failed", err));
    }, [movieId]);

    // 2. Initialize HLS
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const hlsUrl = `${API_URL}/video/${movieId}/playlist/`;

        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                startPosition: 0,
                liveSyncDurationCount: 0, 
                
                // === RETRY LOGIC (Wait for Backend) ===
                manifestLoadingTimeOut: 10000,    // Wait 10s before timing out a request
                manifestLoadingRetryDelay: 2000,  // Wait 2s before retrying after a 404
                manifestLoadingMaxRetry: 60,      // Retry 60 times (approx 2 mins of waiting)
                
                // Optional: Also retry loading individual segments if they are slow to generate
                fragLoadingRetryDelay: 1000,
                fragLoadingMaxRetry: 60,
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.ERROR, (_, data) => {
                // Only destroy if it's a fatal error AND we have exhausted our retries
                if (data.fatal) {
                    console.error("HLS Fatal Error:", data);
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // Try to recover network errors (though maxRetry usually handles this)
                            console.log("fatal network error encountered, trying to recover");
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("fatal media error encountered, trying to recover");
                            hls.recoverMediaError();
                            break;
                        default:
                            // Cannot recover, stop playback
                            setError("Playback Error: " + data.type);
                            hls.destroy();
                            break;
                    }
                }
            });

            return () => hls.destroy();
        } 
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native support (Safari) - Safari does not allow detailed retry config easily
            video.src = hlsUrl;
        } 
        else {
            setError("Your browser does not support HLS.");
        }
    }, [movieId]);

    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ width: '100%', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
            <video 
                ref={videoRef} 
                controls 
                style={{ width: '100%', display: 'block' }}
                crossOrigin="anonymous"
            >
                {subtitles.map((sub) => (
                    <track
                        key={sub.language}
                        kind="subtitles"
                        label={sub.language_name}
                        srcLang={sub.language}
                        // Ensure path is relative to Nginx root (/media/)
                        src={sub.file_path.startsWith('http') ? sub.file_path : `/media/${sub.file_path}`}
                        default={sub.language === 'fr'}
                    />
                ))}
            </video>
        </Box>
    );
};

export default VideoPlayer;