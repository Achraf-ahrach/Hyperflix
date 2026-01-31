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
        // ... (your existing subtitle logic is fine)
    }, [movieId]);

    // 2. Initialize HLS
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const hlsUrl = `${API_URL}/video/${movieId}/playlist/`;

        // === ERROR LISTENER (The "Black Box" Recorder) ===
        // This catches if the browser rejects the video (e.g. Codec error)
        const handleNativeError = () => {
            if (video.error) {
                console.error("Native Video Error:", video.error);
                if (video.error.code === 3) {
                    setError("Fatal: Browser failed to decode video. (Likely Codec Issue)");
                } else if (video.error.code === 4) {
                    setError("Fatal: Source format not supported.");
                }
            }
        };
        video.addEventListener('error', handleNativeError);

        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls({
                debug: false,
                enableWorker: true, // Improve performance on separate thread
                
                // === RETRY LOGIC (Wait for Backend Transcoding) ===
                manifestLoadingTimeOut: 10000, 
                manifestLoadingRetryDelay: 2000,
                manifestLoadingMaxRetry: 60, // Wait up to ~2 mins for playlist
                
                fragLoadingTimeOut: 20000,   // Segments might take time to transcode
                fragLoadingRetryDelay: 1000,
                fragLoadingMaxRetry: 60,     // Be very patient with segments
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.ERROR, (_, data) => {
                // Filter out non-fatal errors (like buffer stalls)
                if (data.fatal) {
                    console.error("HLS Fatal Error:", data);
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("Network error, trying to recover...");
                            hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("Media error, trying to recover...");
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
            // === SAFARI FALLBACK WITH POLLING ===
            // Safari will error instantly if the playlist is 404. We must poll first.
            const checkStreamReady = async () => {
                try {
                    const response = await fetch(hlsUrl, { method: 'HEAD' });
                    if (response.ok) {
                        video.src = hlsUrl;
                    } else {
                        // Not ready yet, retry in 2s
                        setTimeout(checkStreamReady, 2000);
                    }
                } catch (e) {
                    setTimeout(checkStreamReady, 2000);
                }
            };
            checkStreamReady();
        } 
        else {
            setError("Your browser does not support HLS.");
        }

        // Cleanup
        return () => {
            if (hls) hls.destroy();
            video.removeEventListener('error', handleNativeError);
            video.removeAttribute('src'); // Stop downloading when component unmounts
            video.load();
        };
    }, [movieId]);

    if (error) return (
        <Box sx={{ p: 2, bgcolor: '#330000', color: 'white', borderRadius: 2 }}>
            <Typography variant="h6">Error</Typography>
            <Typography>{error}</Typography>
        </Box>
    );

    return (
        <Box sx={{ width: '100%', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
            <video 
                ref={videoRef} 
                controls 
                style={{ width: '100%', aspectRatio: '16/9', display: 'block' }}
                crossOrigin="anonymous"
                playsInline // Important for iOS
            >
                {/* Subtitle mapping... */}
                {subtitles.map((sub) => (
                    <track
                        key={sub.language}
                        kind="subtitles"
                        label={sub.language_name}
                        srcLang={sub.language}
                        src={sub.file_path.startsWith('http') ? sub.file_path : `/media/${sub.file_path}`}
                        default={sub.language === 'fr'}
                    />
                ))}
            </video>
        </Box>
    );
};

export default VideoPlayer;