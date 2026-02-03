"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "@/lib/axios";

import { Button, Box, Paper } from '@mui/material';
import VideoPlayer from "@/components/MoviePlayer";

const API_BASE_URL = (process.env.STREAMING_API_URL || 'http://localhost:8001') + '/api';

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
        router.push('/');
        return null;
    }

    // User Inputs
    const imdbId = movie.imdb_code || '';
    const magnet = (movie.torrents[movie.torrents.length - 1].url || '');

    // App State
    const [dbId, setDbId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


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
        handleStart();
    }, []);


    return (
        <div>
            <h1>Streaming Page</h1>
            <p>{movie.title}</p>
            <p>{movie.imdb_code}</p>
            <p>{movie.torrents?.length}</p>
            <p>{movie.source}</p>
            {
                movie.torrents?.map((torrent: any) => (
                    <div key={torrent.url}>
                        <p>{torrent.url}</p>
                        <p>{torrent.quality}</p>
                        <p>{torrent.type}</p>
                    </div>
                ))
            }
            <hr />

            {
                loading ? <p>Loading...</p  > :
                    (
                        !dbId ? (
                            <Paper sx={{ p: 4 }}>
                                <Box display="flex" flexDirection="column" gap={3}>
                                    {error && <p style={{ color: 'red' }}>{error}</p>}
                                </Box>
                            </Paper>
                        ) : (
                            <Box>
                                <Button onClick={() => setDbId(null)} sx={{ mb: 2 }}>
                                    ← Watch Another Movie
                                </Button>
                                <VideoPlayer movieId={dbId} />
                            </Box>
                        )
                    )
            }

        </div>
    );

}