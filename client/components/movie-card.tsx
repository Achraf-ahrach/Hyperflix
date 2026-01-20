"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Movie } from "@/lib/types/Movie";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setSelectedMovie } from "@/lib/store/uiSlice";

interface MovieCardProps {
    movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
    const dispatch = useDispatch();
    const router = useRouter();
    
    return (
        <div onClick={() => {
                    // <Link href={}>
            dispatch(setSelectedMovie(movie));
            router.push(`/movie/${movie.imdb_code}`);
        }}>
            <div className="group relative rounded-xl bg-card text-card-foreground shadow-sm transition-all hover:scale-105 hover:shadow-lg overflow-hidden cursor-pointer">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                    <Image
                        src={movie.thumbnail || "https://placehold.co/600x400"}

                        alt={movie.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Eye className="w-12 h-12 text-white/80" />
                    </div>
                </div>

                <div className="p-3 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-sm truncate leading-tight" title={movie.title}>{movie.title}</h3>
                        <div className="flex items-center gap-1 bg-background/80 px-1.5 py-0.5 rounded textxs font-medium shrink-0 border border-border/50">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs">{movie.rating?.toFixed(1)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{movie.year}</span>
                        {/* <span className="truncate max-w-[50%] text-right">• {movie.genre}</span> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
