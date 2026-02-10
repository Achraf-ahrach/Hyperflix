import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Button, 
    Stack 
} from '@mui/material';
import axios from 'axios';
import SettingsIcon from '@mui/icons-material/Settings';

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
    const hlsRef = useRef<Hls | null>(null);
    
    const lastPositionRef = useRef<number>(0); 
    const isSwitchingRef = useRef<boolean>(false);

    // Data State
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [qualities] = useState<string[]>(["1080p", "720p", "480p", "360p"]);
    
    // UI State
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Initializing Stream...");
    const [error, setError] = useState<string | null>(null);
    const [currentQuality, setCurrentQuality] = useState<string | null>(null);
    const [userLanguage] = useState('en');

    // --- 1. CONFIGURATION ---
    const hlsConfig = useMemo(() => ({
        debug: false, // Ensure internal HLS logs are off
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        startPosition: -1,
        maxBufferHole: 2.5, 
        highBufferWatchdogPeriod: 1, 
        nudgeOffset: 0.2, 
        nudgeMaxRetry: 10,
        manifestLoadingTimeOut: 60000,
        fragLoadingTimeOut: 60000,
        levelLoadingTimeOut: 60000,
    }), []);

    // --- 2. DATA FETCHING ---
    useEffect(() => {
        let isMounted = true;
        const initSession = async () => {
            if (!isMounted) return;

            // Subtitles
            axios.get(`${API_BASE_URL}/subtitles/?movie_id=${movieId}&language=${userLanguage}`)
                .then(res => { if (isMounted) setSubtitles(res.data || []); })
                .catch(() => {});

            // Stream Polling
            const checkStream = async (attempt = 1) => {
                if (!isMounted) return;
                try {
                    setStatusMessage(`Buffering Video... (${attempt})`);
                    await axios.head(`${API_BASE_URL}/video/${movieId}/playlist/`);
                    if (isMounted) {
                        setIsPlayerReady(true);
                        setStatusMessage("Ready");
                    }
                } catch (err: any) {
                    if (isMounted && (err.response?.status === 404 || err.response?.status === 503)) {
                        if (attempt < 120) setTimeout(() => checkStream(attempt + 1), 2000);
                        else setError("Stream timed out. Please refresh.");
                    } else if (isMounted) {
                        setError("Network Error: Server unreachable.");
                    }
                }
            };
            checkStream();
        };

        setIsPlayerReady(false);
        setError(null);
        initSession();

        return () => { isMounted = false; };
    }, [movieId]);

    const handleQualityChange = (newQuality: string | null) => {
        if (newQuality === currentQuality) return;
        if (videoRef.current && !videoRef.current.paused) {
            lastPositionRef.current = videoRef.current.currentTime;
            isSwitchingRef.current = true;
        }
        setCurrentQuality(newQuality);
    };

    // --- 3. PLAYER LOGIC ---
    useEffect(() => {
        if (!isPlayerReady || !videoRef.current) return;

        const video = videoRef.current;
        if (hlsRef.current) hlsRef.current.destroy();

        const baseUrl = `${API_BASE_URL}/video/${movieId}/playlist/`;
        const src = currentQuality ? `${baseUrl}?res=${currentQuality}` : baseUrl;

        if (Hls.isSupported()) {
            const hls = new Hls(hlsConfig);
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isSwitchingRef.current && lastPositionRef.current > 0) {
                    video.currentTime = lastPositionRef.current;
                    isSwitchingRef.current = false;
                }
                video.play().catch(() => {});
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.recoverMediaError();
                            break;
                    }
                }
            });
        } 
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            if (isSwitchingRef.current) {
                video.addEventListener('loadedmetadata', () => {
                    video.currentTime = lastPositionRef.current;
                    video.play();
                }, { once: true });
            }
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [isPlayerReady, currentQuality, movieId, hlsConfig]);

    if (error) return (
        <Box sx={{ p: 4, bgcolor: '#220000', color: '#ffaaaa', borderRadius: 2, textAlign: 'center' }}>
            <Typography>{error}</Typography>
            <Button variant="outlined" color="inherit" sx={{ mt: 2 }} onClick={() => window.location.reload()}>Reload</Button>
        </Box>
    );

    return (
        <Box sx={{ width: '100%', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
            {!isPlayerReady && (
                <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>{statusMessage}</Typography>
                </Box>
            )}

            <Box sx={{ position: 'relative', display: isPlayerReady ? 'block' : 'none' }}>
                <video 
                    ref={videoRef} 
                    controls 
                    playsInline
                    style={{ width: '100%', aspectRatio: '16/9', display: 'block', outline: 'none' }}
                    crossOrigin="anonymous"
                    onTimeUpdate={(e) => {
                        if (!isSwitchingRef.current) {
                            lastPositionRef.current = e.currentTarget.currentTime;
                        }
                    }}
                >
                    {subtitles.map((sub, idx) => (
                        <track
                            key={idx}
                            kind="subtitles"
                            label={sub.label || sub.language_name}
                            srcLang={sub.language}
                            src={sub.src?.startsWith('http') ? sub.src : `${API_HOST}${sub.src}`}
                            default={sub.language === userLanguage} 
                        />
                    ))}
                </video>

                <Box sx={{ p: 1.5, bgcolor: '#1a1a1a', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <SettingsIcon sx={{ color: '#888' }} />
                    <Stack direction="row" spacing={1}>
                        <Button variant={currentQuality === null ? "contained" : "outlined"} size="small" onClick={() => handleQualityChange(null)}>Auto</Button>
                        {qualities.map(q => (
                            <Button key={q} variant={currentQuality === q ? "contained" : "outlined"} size="small" onClick={() => handleQualityChange(q)}>{q}</Button>
                        ))}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

export default VideoPlayer;