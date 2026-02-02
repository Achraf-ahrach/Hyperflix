import React, { useState } from 'react';
import { Container, TextField, Button, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import VideoPlayer from './MoviePlayer';
import { api } from './api/axiosConfig';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#e50914' }, // Netflix Red
        background: { default: '#141414', paper: '#1f1f1f' }
    }
});

function App() {
    const [imdbId, setImdbId] = useState('');
    const [magnet, setMagnet] = useState('');
    const [dbId, setDbId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    return (
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
    );
}

export default App;