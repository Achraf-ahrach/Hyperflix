import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, CircularProgress, Alert } from '@mui/material';
import MoviePlayer from './MoviePlayer';
import { api } from './api/axiosConfig';

const App: React.FC = () => {
  // User Inputs
  const [imdbId, setImdbId] = useState<string>('');
  const [magnet, setMagnet] = useState<string>('');

  // App State
  const [dbId, setDbId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartMovie = async () => {
    if (!imdbId || !magnet) return;

    setLoading(true);
    setError(null);

    try {
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

  const handleReset = () => {
    setDbId(null);
    setImdbId('');
    setMagnet('');
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
        Hypertube Player
      </Typography>

      {/* INPUT FORM (Only visible if movie hasn't started) */}
      {!dbId && (
        <Paper sx={{ p: 4, mb: 4, bgcolor: '#1e1e1e', color: 'white' }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Initialize Movie</Typography>
            
            <TextField
              label="IMDB ID (e.g., tt1375666)"
              variant="outlined"
              value={imdbId}
              onChange={(e) => setImdbId(e.target.value)}
              disabled={loading}
              sx={{ bgcolor: '#333', input: { color: 'white' }, label: { color: '#aaa' } }}
            />
            
            <TextField
              label="Magnet Link"
              variant="outlined"
              value={magnet}
              onChange={(e) => setMagnet(e.target.value)}
              disabled={loading}
              multiline
              rows={2}
              sx={{ bgcolor: '#333', textarea: { color: 'white' }, label: { color: '#aaa' } }}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button 
              variant="contained" 
              size="large" 
              onClick={handleStartMovie}
              disabled={!imdbId || !magnet || loading}
              sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' }, height: 50 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Start Streaming'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* PLAYER (Only visible once we have the DB ID) */}
      {dbId && (
        <Box sx={{ 
          width: '100%', 
          bgcolor: 'black', 
          borderRadius: 2, 
          overflow: 'hidden', 
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)' 
        }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e1e1e' }}>
            <Typography sx={{ color: '#aaa' }}>
              Playing IMDB: {imdbId} (DB_ID: {dbId})
            </Typography>
            <Button size="small" onClick={handleReset} sx={{ color: '#ff0000' }}>
              Close / New Movie
            </Button>
          </Box>
          
          {/* We now pass the INTERNAL DB ID to the player */}
          <MoviePlayer movieId={dbId} />
        </Box>
      )}
    </Container>
  );
};

export default App;