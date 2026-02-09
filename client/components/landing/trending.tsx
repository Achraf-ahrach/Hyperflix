"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface TrendingMovie {
  imdb_code: string;
  title: string;
  thumbnail: string | null;
  year: number;
  rating: number;
}

const fetchTrendingMovies = async (): Promise<TrendingMovie[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { data } = await axios.get(`${apiUrl}/movies`);
  return data;
};

export function Trending() {
  const router = useRouter();

  const { data: trendingItems, isLoading, isError } = useQuery<TrendingMovie[]>({
    queryKey: ["movies", "trending"],
    queryFn: fetchTrendingMovies,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleMovieClick = () => {
    router.push("/login");
  };

  if (isLoading) {
    return (
      <section className="relative px-4 md:px-8 lg:px-44 py-12">
        <h2 className="text-xl md:text-2xl font-bold mb-8">Trending Now</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="relative aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !trendingItems) {
    return (
      <section className="relative px-4 md:px-8 lg:px-44 py-12">
        <h2 className="text-xl md:text-2xl font-bold mb-8">Trending Now</h2>
        <p className="text-red-500">Failed to load trending movies</p>
      </section>
    );
  }

  return (
    <section className="relative px-4 md:px-8 lg:px-44 py-12">
      <h2 className="text-xl md:text-2xl font-bold mb-8">Trending Now</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {trendingItems.map((item, index) => (
          <div
            key={item.imdb_code}
            className="relative aspect-[2/3] group cursor-pointer"
            onClick={handleMovieClick}
          >
            <div className="absolute -left-8 md:-left-10 lg:-left-12 -bottom-2.5 md:-bottom-3.75 z-20 select-none pointer-events-none">
              <span
                className="text-[80px] md:text-[120px] lg:text-[160px] font-black leading-none drop-shadow-md"
                style={{
                  WebkitTextStroke: "2px rgba(255,255,255,0.8)",
                  color: "black",
                }}
              >
                {/* {index + 1} */}
              </span>
            </div>

            <div className="w-full h-full rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer relative z-10 shadow-2xl">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400 text-sm text-center px-2">
                    {item.title}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
