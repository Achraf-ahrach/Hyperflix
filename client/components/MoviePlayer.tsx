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
    const lastNudge = useRef<number>(0);

    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [levels, setLevels] = useState<{ index: number; label: string }[]>([]);
    
    const [isReady, setIsReady] = useState(false);
    const [msg, setMsg] = useState("Starting...");
    const [terminalError, setTerminalError] = useState<string | null>(null);
    const [quality, setQuality] = useState<number | "auto">("auto");
    const [subLang, setSubLang] = useState<string>('off');
    const [anchorSub, setAnchorSub] = useState<null | HTMLElement>(null);
    const [retryToken, setRetryToken] = useState<number>(0);

    // --- CONFIG: Aggressive Gap Skipping ---
    const hlsConfig = useMemo(() => ({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        capLevelToPlayerSize: true,
        backBufferLength: 60,
        maxBufferLength: 20,
        startPosition: -1,
        maxBufferHole: 1.0,
        highBufferWatchdogPeriod: 1,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 10,
        startFragPrefetch: false,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: 4,
        fragLoadingRetryDelay: 1000,
        fragLoadingMaxRetryTimeout: 8000,
        manifestLoadingTimeOut: 60000,
        fragLoadingTimeOut: 60000,
        levelLoadingTimeOut: 60000,
    }), []);

    // --- DATA FETCHING ---
    // Fetch subtitles only when movieId changes (Retry should not refetch subs)
    useEffect(() => {
        let mounted = true;
        axios.get<Subtitle[]>(`${API_BASE_URL}/subtitles/?movie_id=${movieId}`)
            .then(res => {
                if (!mounted) return;
                setSubtitles(res.data || []);
                if (res.data?.some(s => s.language === 'en')) setSubLang('en');
            })
            .catch(() => {});
        return () => { mounted = false; };
    }, [movieId]);

    // HEAD readiness polling + status endpoint UI
    useEffect(() => {
        let mounted = true;
        const checkStream = async (attempt = 1) => {
            if (!mounted) return;
            try {
                if (attempt % 5 === 0) setMsg(`Buffering... (${attempt})`);
                await axios.head(`${API_BASE_URL}/video/${movieId}/playlist/`);
                if (mounted) { setIsReady(true); setMsg("Ready"); }
            } catch (err: any) {
                const status = err?.response?.status;
                if (status === 410) {
                    setTerminalError("Torrent error or unavailable. Please try another source.");
                    setIsReady(false);
                    return; // stop polling
                }
                if (attempt < 60 && mounted) setTimeout(() => checkStream(attempt + 1), 2000);
            }
        };
        checkStream();

        // Status polling to show swarm/progress while waiting
        const statusTimer = setInterval(async () => {
            if (!mounted || isReady) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/video/${movieId}/status/`);
                const data = res.data as any;
                const swarm = data?.swarm || {};
                const progress = data?.progress ?? 0;
                const problem = data?.problem || null;
                setMsg(`Progress ${progress?.toFixed?.(1) || progress}% — seeds ${swarm.seeds || 0}, peers ${swarm.peers || 0}, down ${swarm.down_kbps || 0} kB/s`);
                if (problem === 'error') {
                    setTerminalError("Torrent error or unavailable. Please try another source.");
                }
            } catch {}
        }, 3000);

        return () => { mounted = false; clearInterval(statusTimer); };
    }, [movieId, retryToken, isReady]);

    const retryStart = () => {
        setTerminalError(null);
        setIsReady(false);
        setMsg('Retrying...');
        setRetryToken(x => x + 1);
    };

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

    const changeQuality = (q: number | "auto") => {
        if (q === quality) return;
        setQuality(q);
        const hls = hlsRef.current;
        if (hls) {
            if (q === "auto") {
                hls.currentLevel = -1; // auto ABR
            } else {
                hls.currentLevel = q;
            }
        }
    };

    // --- PLAYER LOGIC ---
    useEffect(() => {
        if (!isReady || !videoRef.current) return;
        const vid = videoRef.current;
        if (hlsRef.current) hlsRef.current.destroy();

        const base = `${API_BASE_URL}/video/${movieId}/playlist/`;
        const src = base; // always load master; quality via Hls levels

        let nudge = () => {};
        if (Hls.isSupported()) {
            const hls = new Hls(hlsConfig);
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(vid);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const discovered = hls.levels || [];
                const lvls = discovered.map((lvl, idx) => {
                    const height = (lvl as any).height as number | undefined;
                    const name = (lvl as any).name as string | undefined;
                    const label = name || (height ? `${height}p` : `Level ${idx}`);
                    return { index: idx, label };
                });
                setLevels(lvls);
                vid.play().catch(() => {});
            });

            nudge = () => {
                const now = Date.now();
                if (now - lastNudge.current < 3000) return;
                lastNudge.current = now;
                try {
                    const ct = vid.currentTime;
                    vid.currentTime = Math.max(0, ct + 0.05);
                } catch {}
                try { hls.recoverMediaError(); } catch {}
                try { hls.startLoad(); } catch {}
            };

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    data.type === Hls.ErrorTypes.NETWORK_ERROR ? hls.startLoad() : hls.recoverMediaError();
                } else {
                    // Non-fatal: attempt small nudge to unstuck
                    if (data.details === 'bufferStalledError' || data.details === 'fragLoadError' || data.details === 'fragLoadEmergencyAborted') {
                        nudge();
                    }
                }
            });

            hls.on(Hls.Events.BUFFER_STALLED, nudge);
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
    }, [isReady, movieId, hlsConfig]);

    return (
        <Box sx={{ width: '100%', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
            {!isReady && (
                <Box sx={{ height: '56.25vw', maxHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {!terminalError ? (
                        <>
                            <CircularProgress color="inherit" />
                            <Typography sx={{ mt: 2, opacity: 0.7 }}>{msg}</Typography>
                            <Typography sx={{ mt: 0.5, opacity: 0.6 }}>Fetching torrent metadata and segments...</Typography>
                            <Button sx={{ mt: 2 }} variant="outlined" color="inherit" onClick={retryStart}>Retry</Button>
                        </>
                    ) : (
                        <>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>{terminalError}</Typography>
                            <Typography sx={{ mt: 1, opacity: 0.7 }}>HEAD returned 410 — the torrent failed or is gone.</Typography>
                            <Button sx={{ mt: 2 }} variant="contained" color="error" onClick={retryStart}>Retry</Button>
                        </>
                    )}
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
                            <Button variant={quality==="auto"?"contained":"outlined"} size="small" onClick={()=>changeQuality("auto")}>Auto</Button>
                            {levels.map(l => (
                                <Button key={l.index} variant={quality===l.index?"contained":"outlined"} size="small" onClick={()=>changeQuality(l.index)}>{l.label}</Button>
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