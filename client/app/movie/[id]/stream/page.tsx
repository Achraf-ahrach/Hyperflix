"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";

export default function StreamingPage() {

    const router = useRouter();
    const { id } = useParams();

    const movie = useSelector((state: any) => state.ui.selectedMovie);

    if (!movie) {
        // Uncomment this
        // router.push('/');
        return null;
    }

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
        </div>
    );

}