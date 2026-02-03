"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchMovies } from "@/lib/hooks/useSearchMovies";
import { MovieCard } from "@/components/movie-card";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useSearchMovies(query);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground">
          Showing results for <span className="font-semibold">"{query}"</span>
        </p>
      </div>


      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      ) : data?.results && data.results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data.results.map((movie) => (
            <MovieCard key={movie.imdb_code} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p>No movies found matching "{query}"</p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </main>
  );
}
