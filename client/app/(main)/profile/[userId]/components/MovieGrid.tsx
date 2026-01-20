"use client"
import { useState } from "react";
import { Movie } from "../types/types";
import { MovieCard } from "./MovieCard";
import { Pagination } from "./Pagination";
import { useRouter } from "next/router";




// MovieGrid Component with Pagination
export const MovieGrid: React.FC<{ 
  movies: Movie[];
  isWatchLater: boolean;
  itemsPerPage: number;
  currentPage: number;
  total: number;
  onPageChange: (pageNum : number) => void;
}> = ({ movies, isWatchLater = false, itemsPerPage = 20 , currentPage, onPageChange, total}) => {

  const totalPages = Math.ceil(total / itemsPerPage);
  const currentMovies = movies;

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {currentMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            isWatchLater={isWatchLater}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
