import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import { 
    Box, Typography, CircularProgress, Button, Stack, Menu, MenuItem 
} from '@mui/material';
import axios from 'axios';
import SettingsIcon from '@mui/icons-material/Settings';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';

const API_HOST = process.env.REACT_APP_STREAMING_API_URL || 'http://localhost:8001';
const API_BASE_URL = `${API_HOST}/api`;

interface VideoPlayerProps { movieId: number; }
interface Subtitle { language: string; language_name: string; label?: string; src?: string; }

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movieId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const lastPos = useRef<number>(0); 
    const isSwitching = useRef<boolean>(false);

    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [qualities] = useState<string[]>(["1080p", "720p", "480p", "360p"]);
    
    const [isReady, setIsReady] = useState(false);
    const [msg, setMsg] = useState("Starting...");
    const [quality, setQuality] = useState<string | null>(null);
    const [subLang, setSubLang] = useState<string>('off');
    const [anchorSub, setAnchorSub] = useState<null | HTMLElement>(null);

    // --- CONFIG: Aggressive Gap Skipping ---
    const hlsConfig = useMemo(() => ({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        startPosition: -1,
        maxBufferHole: 2.5, // Jumps holes < 2.5s
        highBufferWatchdogPeriod: 1, 
        nudgeOffset: 0.2, // Nudges if stuck
        nudgeMaxRetry: 10,
        manifestLoadingTimeOut: 60000,
        fragLoadingTimeOut: 60000,
        levelLoadingTimeOut: 60000,
    }), []);

    // --- DATA FETCHING ---
    useEffect(() => {
        let mounted = true;

        // Subtitles
        axios.get<Subtitle[]>(`${API_BASE_URL}/subtitles/?movie_id=${movieId}`)
            .then(res => { 
                if (mounted) {
                    setSubtitles(res.data || []);
                    if (res.data?.some(s => s.language === 'en')) setSubLang('en');
                }
            }).catch(() => {});

        // Infinite Stream Polling
        const checkStream = async (attempt = 1) => {
            if (!mounted) return;
            try {
                if (attempt % 5 === 0) setMsg(`Buffering... (${attempt})`);
                await axios.head(`${API_BASE_URL}/video/${movieId}/playlist/`);
                if (mounted) { setIsReady(true); setMsg("Ready"); }
            } catch {
                if (mounted) setTimeout(() => checkStream(attempt + 1), 2000);
            }
        };
        checkStream();
        return () => { mounted = false; };
    }, [movieId]);

    // --- SUBTITLE LOGIC ---
    useEffect(() => {
        if (!videoRef.current) return;
        const vid = videoRef.current;
        const apply = () => {
            Array.from(vid.textTracks).forEach(t => {
                t.mode = (subLang !== 'off' && t.language === subLang) ? 'showing' : 'hidden';
            });
        };
        apply();
        vid.addEventListener('loadedmetadata', apply);
        return () => vid.removeEventListener('loadedmetadata', apply);
    }, [subLang, subtitles]);

    const changeQuality = (q: string | null) => {
        if (q === quality) return;
        if (videoRef.current && !videoRef.current.paused) {
            lastPos.current = videoRef.current.currentTime;
            isSwitching.current = true;
        }
        setQuality(q);
    };

    // --- PLAYER LOGIC ---
    useEffect(() => {
        if (!isReady || !videoRef.current) return;
        const vid = videoRef.current;
        if (hlsRef.current) hlsRef.current.destroy();

        const base = `${API_BASE_URL}/video/${movieId}/playlist/`;
        const src = quality ? `${base}?res=${quality}` : base;

        if (Hls.isSupported()) {
            const hls = new Hls(hlsConfig);
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(vid);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isSwitching.current && lastPos.current > 0) {
                    vid.currentTime = lastPos.current;
                    isSwitching.current = false;
                }
                vid.play().catch(() => {});
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    data.type === Hls.ErrorTypes.NETWORK_ERROR ? hls.startLoad() : hls.recoverMediaError();
                }
            });
        } 
        else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
            vid.src = src;
            const onMeta = () => {
                if (isSwitching.current) vid.currentTime = lastPos.current;
                vid.play();
            };
            vid.addEventListener('loadedmetadata', onMeta, { once: true });
        }
        return () => { if (hlsRef.current) hlsRef.current.destroy(); };
    }, [isReady, quality, movieId, hlsConfig]);

    return (
        <Box sx={{ width: '100%', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
            {!isReady && (
                <Box sx={{ height: '56.25vw', maxHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <CircularProgress color="inherit" />
                    <Typography sx={{ mt: 2, opacity: 0.7 }}>{msg}</Typography>
                </Box>
            )}

            <Box sx={{ position: 'relative', display: isReady ? 'block' : 'none' }}>
                <video 
                    ref={videoRef} controls playsInline autoPlay muted
                    style={{ width: '100%', aspectRatio: '16/9', display: 'block', outline: 'none' }}
                    crossOrigin="anonymous"
                    onTimeUpdate={(e) => { if (!isSwitching.current) lastPos.current = e.currentTarget.currentTime; }}
                >
                    {subtitles.map((s, i) => (
                        <track key={i} kind="subtitles" label={s.label||s.language_name} srcLang={s.language} 
                               src={s.src?.startsWith('http') ? s.src : `${API_HOST}${s.src}`} default={s.language === subLang} />
                    ))}
                </video>

                <Box sx={{ p: 1.5, bgcolor: '#1a1a1a', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <SettingsIcon sx={{ color: '#888' }} />
                        <Stack direction="row" spacing={1}>
                            <Button variant={quality===null?"contained":"outlined"} size="small" onClick={()=>changeQuality(null)}>Auto</Button>
                            {qualities.map(q => (
                                <Button key={q} variant={quality===q?"contained":"outlined"} size="small" onClick={()=>changeQuality(q)}>{q}</Button>
                            ))}
                        </Stack>
                    </Box>

                    <Box>
                        <Button startIcon={<ClosedCaptionIcon />} onClick={(e)=>setAnchorSub(e.currentTarget)} 
                                variant={subLang!=='off'?"contained":"outlined"} size="small">
                            {subLang==='off'?'CC Off':subLang.toUpperCase()}
                        </Button>
                        <Menu anchorEl={anchorSub} open={Boolean(anchorSub)} onClose={()=>setAnchorSub(null)} PaperProps={{sx:{bgcolor:'#222',color:'white'}}}>
                            <MenuItem onClick={()=>{setSubLang('off');setAnchorSub(null)}} selected={subLang==='off'}>Off</MenuItem>
                            {subtitles.map(s => (
                                <MenuItem key={s.language} onClick={()=>{setSubLang(s.language);setAnchorSub(null)}} selected={subLang===s.language}>
                                    {s.language_name||s.label||s.language.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default VideoPlayer;