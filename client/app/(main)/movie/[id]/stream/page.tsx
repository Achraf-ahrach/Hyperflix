"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "@/lib/axios";
import {
  Button,
  Box,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Chip,
  Stack,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VideoPlayer from "@/components/MoviePlayer";

const API_BASE_URL =
  (process.env.STREAMING_API_URL || "http://localhost:8001") + "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default function StreamingPage() {
  const router = useRouter();
  const movie = useSelector((state: any) => state.ui.selectedMovie);

  const [dbId, setDbId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!movie) {
    router.push("/");
    return null;
  }

  const imdbId = movie.imdb_code || "";

  const handleStart = async (selectedMagnet: string) => {
    if (!imdbId || !selectedMagnet) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/video/${imdbId}/start/`, {
        magnet_link: selectedMagnet,
        imdb_id: imdbId,
      });

      if (res.data.id) {
        setDbId(res.data.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to start movie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 1. SELECTION SCREEN (Show if no video ID is ready yet) */}
      {!dbId && (
        <Paper
          elevation={3}
          sx={{ p: 4, textAlign: "center", bgcolor: "#1a1a1a", color: "white" }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
            {movie.title}
          </Typography>

          {movie.year && (
            <Typography variant="h6" color="gray" gutterBottom>
              {movie.year} • {movie.runtime} min
            </Typography>
          )}

          <Box sx={{ my: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Select Quality to Play
            </Typography>

            {/* Error Message */}
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            {/* Loading Spinner */}
            {loading ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
              >
                <CircularProgress color="secondary" />
                <Typography>Initializing Stream...</Typography>
              </Box>
            ) : (
              /* Quality Buttons */
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
                alignItems="center"
              >
                {movie.torrents?.map((torrent: any, index: number) => (
                  <Button
                    key={`${torrent.quality}-${index}`}
                    variant="contained"
                    size="large"
                    color="secondary"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleStart(torrent.url)}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: "1.1rem",
                      textTransform: "none",
                      minWidth: "150px",
                    }}
                  >
                    {torrent.quality}
                    {torrent.type && (
                      <span
                        style={{
                          fontSize: "0.8em",
                          opacity: 0.7,
                          marginLeft: "8px",
                        }}
                      >
                        ({torrent.type})
                      </span>
                    )}
                  </Button>
                ))}
              </Stack>
            )}
          </Box>

          {/* Movie Metadata / Genres */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            {movie.genres?.map((genre: string) => (
              <Chip
                key={genre}
                label={genre}
                sx={{ bgcolor: "#333", color: "#fff" }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* 2. PLAYER SCREEN (Show ONLY when dbId exists) */}
      {dbId && (
        <Box>
          <Button
            onClick={() => setDbId(null)}
            variant="outlined"
            color="inherit"
            sx={{ mb: 2 }}
          >
            ← Select Different Quality
          </Button>

          <VideoPlayer movieId={dbId} />
        </Box>
      )}
    </Container>
  );
}
