"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { FilterBar } from "@/components/filter-bar";
import { MovieCard } from "@/components/movie-card";

// Mock Data
const MOCK_MOVIES = [
  {
    id: 1,
    title: "Dune: Part Two",
    year: 2024,
    rating: 8.9,
    genre: "Sci-Fi",
    image: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", // Using TMDB placeholders if possible, or generic
    watched: false,
  },
  {
    id: 2,
    title: "The Dark Knight",
    year: 2008,
    rating: 9.0,
    genre: "Action",
    image: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    watched: true,
  },
  {
    id: 3,
    title: "Interstellar",
    year: 2014,
    rating: 8.6,
    genre: "Sci-Fi",
    image: "https://image.tmdb.org/t/p/w500/gEU2QniL6C8zt7472vQlVufphM3.jpg",
    watched: false,
  },
  {
    id: 4,
    title: "Inception",
    year: 2010,
    rating: 8.8,
    genre: "Sci-Fi",
    image: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKqJCZVPr6JnJ7pGLV.jpg",
    watched: false,
  },
  {
    id: 5,
    title: "Parasite",
    year: 2019,
    rating: 8.5,
    genre: "Thriller",
    image: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    watched: false,
  },
  {
    id: 6,
    title: "Civil War",
    year: 2024,
    rating: 7.6,
    genre: "Action",
    image: "https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9AdeGSxwooglzf.jpg",
    watched: false,
  },
  {
    id: 7,
    title: "The Fellowship of the Ring",
    year: 2001,
    rating: 8.8,
    genre: "Adventure",
    image: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    watched: true,
  },
  {
    id: 8,
    title: "Everything Everywhere All At Once",
    year: 2022,
    rating: 7.8,
    genre: "Sci-Fi",
    image: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    watched: false,
  },
  {
    id: 9,
    title: "Fast X",
    year: 2023,
    rating: 7.1,
    genre: "Action",
    image: "https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg",
    watched: false,
  },
  {
    id: 10,
    title: "Black Adam",
    year: 2022,
    rating: 6.8,
    genre: "Action",
    image: "https://image.tmdb.org/t/p/w500/pFlaoHTZeyNkG83vxsAJiGzfKWZ.jpg",
    watched: false,
  }
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [movies, setMovies] = useState(MOCK_MOVIES);

  // Filter States
  const [hideWatched, setHideWatched] = useState(false);

  useEffect(() => {
    // 1. Fetch Profile
    api.get("/auth/profile")
      .then(({ data }) => setUser(data))
      .catch(() => {
        // If the backend says 401 (Unauthorized), redirect to login
        router.push("/login");
      });
  }, [router]);

  /* 
     Ideally, we would perform filtering/sorting here or on the backend.
     For this UI demo, we will just pass dummy handlers to the FilterBar. 
  */
  const handleSortChange = (val: string) => console.log("Sort:", val);
  const handleGenreChange = (val: string) => console.log("Genre:", val);
  const handleRatingChange = (val: string) => console.log("Rating:", val);
  const handleYearChange = (val: string) => console.log("Year:", val);
  const handleHideWatched = (val: boolean) => setHideWatched(val);

  const filteredMovies = hideWatched ? movies.filter(m => !m.watched) : movies;

  // if (!user) return <p className="p-10">Loading...</p>;

  return (
    <div className="antialiased bg-background min-h-screen text-foreground">
      <Navbar />
      <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">

        <FilterBar
          onSortChange={handleSortChange}
          onGenreChange={handleGenreChange}
          onRatingChange={handleRatingChange}
          onYearChange={handleYearChange}
          onHideWatchedChange={handleHideWatched}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

      </main>
    </div>
  );
}
