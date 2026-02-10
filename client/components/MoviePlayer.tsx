import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Button, 
    Stack, 
    IconButton,
    Tooltip
} from '@mui/material';
import axios from 'axios';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// --- CONFIGURATION ---
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
    
    // Track playback position strictly for switching
    const lastPositionRef = useRef<number>(0); 
    const isSwitchingRef = useRef<boolean>(false);

    // Data State
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [qualities] = useState<string[]>(["1080p", "720p", "480p", "360p"]);
    
    // UI State
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Initializing Stream...");
    const [error, setError] = useState<string | null>(null);
    const [currentQuality, setCurrentQuality] = useState<string | null>(null); // null = Auto
    const [userLanguage] = useState('en');

    // --- 1. DATA FETCHING ---
    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
            if (!isMounted) return;

            // Fetch Subtitles
            axios.get(`${API_BASE_URL}/subtitles/?movie_id=${movieId}&language=${userLanguage}`)
                .then(res => { if (isMounted) setSubtitles(res.data || []); })
                .catch(() => {});

            // Poll for Stream Availability
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
                        if (attempt < 120) { 
                            setTimeout(() => checkStream(attempt + 1), 2000);
                        } else {
                            setError("Stream timed out. Please try refreshing.");
                        }
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

    // --- 2. HLS CONFIGURATION ---
    const hlsConfig = useMemo(() => ({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90, 
        maxBufferLength: 30,  
        startPosition: -1, // -1 means "don't force start", let us handle it manually
    }), []);

    // --- 3. QUALITY SWITCH HANDLER ---
    const handleQualityChange = (newQuality: string | null) => {
        if (newQuality === currentQuality) return;
        
        // 1. SNAPSHOT: Save current time before destroying player
        if (videoRef.current && !videoRef.current.paused) {
            lastPositionRef.current = videoRef.current.currentTime;
            isSwitchingRef.current = true;
            console.log(`[Switching] Saved position: ${lastPositionRef.current}s`);
        }

        setCurrentQuality(newQuality);
    };

    // --- 4. PLAYER CORE LOGIC ---
    useEffect(() => {
        if (!isPlayerReady || !videoRef.current) return;

        const video = videoRef.current;
        
        // Destroy old instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        // Construct URL
        const baseUrl = `${API_BASE_URL}/video/${movieId}/playlist/`;
        const src = currentQuality ? `${baseUrl}?res=${currentQuality}` : baseUrl;

        console.log(`[Player] Loading: ${currentQuality || "Auto"} at ${isSwitchingRef.current ? lastPositionRef.current : 0}s`);

        if (Hls.isSupported()) {
            const hls = new Hls(hlsConfig);
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // 2. RESTORE: If we are switching, seek immediately
                if (isSwitchingRef.current && lastPositionRef.current > 0) {
                    console.log(`[Player] Restoring position to ${lastPositionRef.current}`);
                    video.currentTime = lastPositionRef.current;
                    isSwitchingRef.current = false; // Reset flag
                }
                
                // Play
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.log("Autoplay blocked/waiting:", e.message));
                }
            });

            // ERROR HANDLING
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn("Network error, recovering...");
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn("Media error, recovering...");
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            setError("Playback failed. Try a lower quality.");
                            break;
                    }
                }
            });
        } 
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari Native
            video.src = src;
            // Native player handles seeking differently, we rely on metadata event
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

    // --- 5. RENDER ---
    if (error) return (
        <Box sx={{ p: 4, bgcolor: '#220000', color: '#ffaaaa', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6">Playback Error</Typography>
            <Typography variant="body2">{error}</Typography>
            <Button variant="outlined" color="inherit" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
                Reload
            </Button>
        </Box>
    );

    return (
        <Box sx={{ width: '100%', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
            
            {/* Loading Overlay */}
            {!isPlayerReady && (
                <Box sx={{ 
                    height: '56.25vw', maxHeight: '600px',
                    display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', 
                    color: '#fff', bgcolor: '#111'
                }}>
                    <CircularProgress color="primary" thickness={5} size={60} />
                    <Typography sx={{ mt: 3, fontWeight: 500 }}>{statusMessage}</Typography>
                </Box>
            )}

            {/* Video Container */}
            <Box sx={{ position: 'relative', display: isPlayerReady ? 'block' : 'none' }}>
                <video 
                    ref={videoRef} 
                    controls 
                    playsInline
                    style={{ width: '100%', aspectRatio: '16/9', display: 'block', outline: 'none' }}
                    crossOrigin="anonymous"
                    // Update ref manually on timeupdate just in case
                    onTimeUpdate={(e) => {
                        if (!isSwitchingRef.current) {
                            lastPositionRef.current = e.currentTarget.currentTime;
                        }
                    }}
                >
                    {subtitles.map((sub, idx) => (
                        <track
                            key={`${sub.language}-${idx}`}
                            kind="subtitles"
                            label={sub.label || sub.language_name}
                            srcLang={sub.language}
                            src={sub.src?.startsWith('http') ? sub.src : `${API_HOST}${sub.src}`}
                            default={sub.language === userLanguage} 
                        />
                    ))}
                </video>

                {/* Quality Controls */}
                <Box sx={{ 
                    p: 1.5, bgcolor: '#1a1a1a', borderTop: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 2
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <SettingsIcon sx={{ color: '#888' }} />
                        <Typography variant="body2" sx={{ color: '#aaa' }}>Quality:</Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant={currentQuality === null ? "contained" : "outlined"}
                            size="small"
                            onClick={() => handleQualityChange(null)}
                            sx={{ 
                                minWidth: '60px',
                                borderColor: '#444', 
                                color: currentQuality === null ? '#000' : '#ddd',
                                bgcolor: currentQuality === null ? '#fff' : 'transparent',
                                '&:hover': { bgcolor: currentQuality === null ? '#ddd' : '#333' }
                            }}
                        >
                            Auto
                        </Button>
                        
                        {qualities.map(q => (
                            <Button
                                key={q}
                                variant={currentQuality === q ? "contained" : "outlined"}
                                size="small"
                                onClick={() => handleQualityChange(q)}
                                sx={{ 
                                    borderColor: '#444', 
                                    color: currentQuality === q ? '#000' : '#ddd',
                                    bgcolor: currentQuality === q ? '#fff' : 'transparent',
                                    '&:hover': { bgcolor: currentQuality === q ? '#ddd' : '#333' }
                                }}
                            >
                                {q}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

export default VideoPlayer;