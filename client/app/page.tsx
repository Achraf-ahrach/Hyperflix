"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterBar } from "@/components/filter-bar";
import { MovieCard } from "@/components/movie-card";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { useMoviesLibrary } from "@/lib/hooks/useMovies";
import InfiniteScrollContainer from "@/components/infinite-scroll-container";


export default function Home() {
  const { data: user, isLoading } = useAuth();
  // const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const size = 10;
  const router = useRouter();
  // const [movies, setMovies] = useState(MOCK_MOVIES);

  const { 
    data: movies, 
    isLoading: moviesLoading,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    refetch
   } = useMoviesLibrary();

  // Filter States
  const [hideWatched, setHideWatched] = useState(false);

  // useEffect(() => {
  //   // 1. Fetch Profile
  //   api.get("/auth/profile")
  //     .then(({ data }) => setUser(data))
  //     .catch(() => {
  //       // If the backend says 401 (Unauthorized), redirect to login
  //       router.push("/login");
  //     });
  // }, [router]);

  /* 
     Ideally, we would perform filtering/sorting here or on the backend.
     For this UI demo, we will just pass dummy handlers to the FilterBar. 
  */
  // const handleSortChange = (val: string) => console.log("Sort:", val);
  // const handleGenreChange = (val: string) => console.log("Genre:", val);
  // const handleRatingChange = (val: string) => console.log("Rating:", val);
  // const handleYearChange = (val: string) => console.log("Year:", val);
  // const handleHideWatched = (val: boolean) => setHideWatched(val);

  // const filteredMovies = hideWatched ? movies.filter(m => !m.watched) : movies;

  // if (!user) return <p className="p-10">Loading...</p>;

  function DashboardPage() {
    return (
      <div className="antialiased bg-background min-h-screen text-foreground">
        <Navbar />
        <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">

          <FilterBar
            onSortChange={() => { }}
            onGenreChange={() => { }}
            onRatingChange={() => { }}
            onYearChange={() => { }}
            onHideWatchedChange={() => { }}
          />

          {moviesLoading ? (
            <p>Loading...</p>
          ) : (
            movies ? (
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
                  {movies?.pages.map((page, i) => page?.map((movie, j) => (
                    <MovieCard key={movie.imdb_code || `${i}-${j}`} movie={movie} />
                  )))}
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    </div>
                  )}
                </InfiniteScrollContainer>
              </div>
            ) : (
              <p>No movies found</p>
            )
          )}

        </main>
      </div>
    );
  }


  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <div className="text-center">
  //         <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
  //         <p className="text-muted-foreground">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }
  return <DashboardPage />;
}
