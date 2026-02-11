"use client";

import { useEffect, useState } from "react";
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
      // console.error(err);
      setError(err.response?.data?.message || "Failed to start movie");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movie.torrents.length > 0) {
      handleStart(movie.torrents[movie.torrents.length - 1].url);
    }
  }, [movie]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
        </Stack>
      )}

      {dbId && (
        <Box>
          <VideoPlayer movieId={dbId} />
        </Box>
      )}
    </Container>
  );
}