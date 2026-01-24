"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "@/lib/axios";
import MoviePlayer from "@/components/MoviePlayer";

const API_BASE_URL = 'http://localhost:8000/api';


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

    const handleReset = () => {
        setDbId(null);
        setImdbId('');
        setMagnet('');
        setError(null);
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



            <div>
                <p>
                    Hypertube Player
                </p>

                {/* INPUT FORM (Only visible if movie hasn't started) */}
                {!dbId && (
                    <div>
                        <div>
                            <p>Initialize Movie</p>
                            {error && <div style={{ color: 'red' }}>{error}</div>}

                        </div>
                    </div>
                )}

                {/* PLAYER (Only visible once we have the DB ID) */}
                {
                    dbId 
                }
                {dbId && (
                    <div style={{
                        width: '100%',
                        height: '80vh',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}>
                        {/* <div sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e1e1e' }}> */}
                            {/* <p sx={{ color: '#aaa' }}>
                                Playing IMDB: {imdbId} (DB_ID: {dbId})
                            </p>
                            <Button size="small" onClick={handleReset} sx={{ color: '#ff0000' }}>
                                Close / New Movie
                            </Button> */}
                        {/* </div> */}

                        <MoviePlayer movieId={dbId} />
                    </div>
                )} 
            </div>
        </div>
    );

}