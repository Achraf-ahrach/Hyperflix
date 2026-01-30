"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "@/lib/axios";

import { Container, TextField, Button, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import VideoPlayer from "@/components/MoviePlayer";


const API_BASE_URL = 'http://localhost:8001/api';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#e50914' }, // Netflix Red
        background: { default: '#141414', paper: '#1f1f1f' }
    }
});


const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


export default function StreamingPage() {

    const router = useRouter();
    const { id } = useParams();

    const movie = useSelector((state: any) => state.ui.selectedMovie);

    if (!movie) {
        // Uncomment this
        // router.push('/');
        return null;
    }

    // User Inputs
    const [imdbId, setImdbId] = useState<string>(movie.imdb_code || '');
    const [magnet, setMagnet] = useState<string>(movie.torrents[movie.torrents.length - 1].url || '');

    // App State
    const [dbId, setDbId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartMovie = async () => {
        if (!imdbId || !magnet) alert("IMDB ID and Magnet link are required.");

        setLoading(true);
        setError(null);

        try {
            console.log("Starting movie with IMDB ID:", imdbId);
            // 1. We call the start endpoint using the IMDB ID in the URL
            // The payload includes both the magnet link and the imdb_id as requested
            const response = await api.post(`/video/${imdbId}/start/`, {
                magnet_link: magnet,
                imdb_id: imdbId
            });

            // 2. The backend returns the internal Database ID (e.g., { "id": 42 })
            const internalId = response.data.id;

            if (internalId) {
                setDbId(internalId);
            } else {
                setError("Backend did not return a valid Movie ID.");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to start movie. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!imdbId || !magnet) return;
        setLoading(true);
        setError('');

        try {
            // POST to start torrent/conversion
            const res = await api.post(`/video/${imdbId}/start/`, {
                magnet_link: magnet,
                imdb_id: imdbId
            });
            
            if (res.data.id) {
                setDbId(res.data.id);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to start movie");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Automatically start the movie when the component mounts
        handleStartMovie();
    }, []);


    return (
        <div>
            <h1>Streaming Page</h1>
            <p>{movie.title}</p>
            <p>{movie.imdb_code}</p>
            <p>{movie.torrents?.length}</p>
            {
                movie.torrents?.map((torrent: any) => (
                    <div key={torrent.url}>
                        <p>{torrent.url}</p>
                        <p>{torrent.quality}</p>
                        <p>{torrent.type}</p>
                    </div>
                ))
            }



        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container maxWidth="md" sx={{ mt: 5 }}>
                <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: '#e50914' }}>
                    Hypertube
                </Typography>

                {!dbId ? (
                    <Paper sx={{ p: 4 }}>
                        <Box display="flex" flexDirection="column" gap={3}>
                            <TextField 
                                label="IMDB ID" 
                                placeholder="tt1375666"
                                value={imdbId}
                                onChange={e => setImdbId(e.target.value)}
                            />
                            <TextField 
                                label="Magnet Link" 
                                multiline 
                                rows={3}
                                value={magnet}
                                onChange={e => setMagnet(e.target.value)}
                            />
                            {error && <Typography color="error">{error}</Typography>}
                            
                            <Button 
                                variant="contained" 
                                size="large" 
                                onClick={handleStart}
                                disabled={loading}
                                sx={{ py: 1.5, fontSize: '1.1rem' }}
                            >
                                {loading ? <CircularProgress size={24} /> : "Start Streaming"}
                            </Button>
                        </Box>
                    </Paper>
                ) : (
                    <Box>
                        <Button onClick={() => setDbId(null)} sx={{ mb: 2 }}>
                            ← Watch Another Movie
                        </Button>
                        <VideoPlayer movieId={dbId} />
                    </Box>
                )}
            </Container>
        </ThemeProvider>
        </div>
    );

}