"use client";

import { FilterBar } from "@/components/filter-bar";
import { MovieCard } from "@/components/movie-card";
import { useMoviesLibrary } from "@/lib/hooks/useMovies";
import InfiniteScrollContainer from "@/components/infinite-scroll-container";

export default function HomePage() {
  const {
    data: movies,
    isLoading: moviesLoading,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useMoviesLibrary();

  return (
    <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <FilterBar
        onSortChange={() => {}}
        onGenreChange={() => {}}
        onRatingChange={() => {}}
        onYearChange={() => {}}
        onHideWatchedChange={() => {}}
      />

      {moviesLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : movies ? (
        <div className="">
          <InfiniteScrollContainer
            onBottomReached={() => {
              if (isFetching || isFetchingNextPage) return;
              if (hasNextPage) {
                fetchNextPage();
              }
            }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {movies?.pages.map((page, i) =>
              page?.map(
                (movie, j) =>
                  movie && (
                    <MovieCard
                      key={`${i}-${j}-${movie.imdb_code}`}
                      movie={movie}
                    />
                  ),
              ),
            )}
            {isFetchingNextPage && (
              <div className="flex justify-center items-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              </div>
            )}
          </InfiniteScrollContainer>
        </div>
      ) : (
        <p>No movies found</p>
      )}
    </main>
  );
}
