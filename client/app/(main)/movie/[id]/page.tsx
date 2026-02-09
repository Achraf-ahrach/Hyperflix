"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, ThumbsUp, Share2, CheckCircle2, Circle, Minus } from "lucide-react";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Movie } from "@/lib/types/Movie";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedMovie } from "@/lib/store/uiSlice";
import { CommentsSection } from "@/features/comment/comment";
import { userService } from "@/services/user.service";
import { toast } from "sonner";
import { is } from "zod/v4/locales";
import { Spinner } from "@/components/ui/spinner";

export default function MovieDetailsPage() {
  const [showNoMagnetPopup, setShowNoMagnetPopup] = useState(false);
  const router = useRouter();
  const { id }: { id: string } = useParams();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [isInWatchlist, setIsInWatchlist] = useState(false);



  const { data: movieQ, isLoading } = useQuery<Movie>({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data } = await api.get(`/movies/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const reduxMovie = useSelector((state: any) => state.ui.selectedMovie);

  // Use Redux movie for data (torrents, etc.) but ALWAYS use API for watched status
  const movie = reduxMovie
    ? { ...reduxMovie, watched: movieQ?.watched ?? false }
    : movieQ;

  // Toggle watched status mutation
  const toggleWatchedMutation = useMutation({
    mutationFn: async (watched: boolean) => {
      if (watched) {
        // Remove from watched
        await api.delete(`/movies/${id}/watched`);
      } else {
        // Add to watched
        await api.post(`/movies/${id}/watched`);
      }
    },
    onMutate: async (watched: boolean) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["movie", id] });

      // Snapshot previous value
      const previousMovie = queryClient.getQueryData(["movie", id]);

      // Optimistically update to the new value
      queryClient.setQueryData(["movie", id], (old: any) => ({
        ...old,
        watched: !watched,
      }));

      return { previousMovie };
    },
    onError: (err, variables, context: any) => {
      // Rollback query cache
      queryClient.setQueryData(["movie", id], context.previousMovie);
    },
    onSuccess: () => {
      // Invalidate individual movie query
      queryClient.invalidateQueries({ queryKey: ["movie", id, "profile"] });

      // Update library query cache to reflect watched status change
      queryClient.setQueriesData(
        { queryKey: ["movies", "library"] },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) =>
              page?.map((movie: any) =>
                movie.imdb_code === id
                  ? { ...movie, watched: !movie.watched }
                  : movie
              )
            ),
          };
        }
      );

      // Update Redux selectedMovie cache
      if (reduxMovie && reduxMovie.imdb_code === id) {
        dispatch(setSelectedMovie({
          ...reduxMovie,
          watched: !reduxMovie.watched
        }));
      }
    },
  });

  const { data: watchListData, isLoading: isWatchListLoading } = useQuery({
    queryKey: ["watchList",],
    queryFn: async () => {
      // console.log("Checking if movie is in watchlist...");
      const { data } = await api.get(`/movies/${id}/watch-later`);
      // console.log("Watchlist response:", data);
      setIsInWatchlist(data);
      return data;
    },
  })

  const { mutate: mutateWatchList, isPending: isWatchListPending } = useMutation({
    mutationFn: async (movieId: string) => {
      if (isInWatchlist) {
        return await userService.deleteMovieFromWatchlist(movieId);
      } else {
        return await userService.addMovieToWatchlist(movieId);
      }
    },
    onSuccess: (result) => {
      if (isInWatchlist) {
        toast.message
        ("Movie removed from watchlist");
      } else {
        toast.message("Movie added to watchlist");
      }
      queryClient.invalidateQueries({ queryKey: ["watchlist", "profile"] });
      setIsInWatchlist(!isInWatchlist);
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  // const movie = useSelector((state: any) => state.ui.selectedMovie) || movieQ;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const handlePlay = () => {
    console.log(movie);
    if (!movie?.torrents || movie?.torrents.length === 0) {
      console.log("No magnets found");
      setShowNoMagnetPopup(true);
    } else {
      console.log("Playing...");
      console.log(movie.torrents);
      // TODO: Navigate to player or open player modal
      router.push(`/movie/${id}/stream`);
    }
  };

  const handleSearch = () => {
    router.push(`/search?q=${encodeURIComponent(movie.title)}`);
  };


  const handleAddToWatchlist = async () => {
    mutateWatchList(id); 
  }

  return (
    <div className="min-h-screen bg-[#141414] font-sans">
      {/* Hero Section */}
      <div className="relative h-[85vh] w-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={
              movie.background_image ||
              movie.thumbnail ||
              "/placeholder-hero.jpg"
            }
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-[#141414] via-[#141414]/20 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-[#141414] via-[#141414]/40 to-transparent" />
        </div>

        {/* Play Button (Centered) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handlePlay}
            className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary text-white flex items-center justify-center transition-transform hover:scale-110 shadow-[0_0_40px_rgba(var(--primary),0.5)] pointer-events-auto backdrop-blur-sm"
            aria-label="Play"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 lg:p-16 space-y-6">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-lg">
              {movie.title}
            </h1>

            <div className="flex items-center gap-4 text-sm md:text-base text-gray-200 font-medium">
              {movie.mpa_rating && (
                <span className="px-2 py-0.5 border border-gray-400 rounded text-xs uppercase">
                  {movie.mpa_rating}
                </span>
              )}
              <span>{movie.year}</span>
              {movie.runtime && (
                <>
                  <span>•</span>
                  <span>
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                </>
              )}
              {movie.genres && (
                <>
                  <span>•</span>
                  <span className="text-primary">
                    {Array.isArray(movie.genres)
                      ? movie.genres.join(", ")
                      : movie.genres}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => toggleWatchedMutation.mutate(movie.watched || false)}
                variant="secondary"
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                disabled={toggleWatchedMutation.isPending}
              >
                {movie.watched ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Watched
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    Mark as Watched
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
                onClick={handleAddToWatchlist}
              >
                {
                  isWatchListLoading ? (
                    <Spinner/>
                  )
                  :
                  isInWatchlist ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                Watch List
              </Button>
              {/* <Button
                variant="secondary"
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
              >
                <ThumbsUp className="w-4 h-4" />
                Like
              </Button>
              <Button
                variant="secondary"
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 px-8 py-12 md:px-12 lg:px-16 max-w-[1800px] mx-auto">
        {/* Left Column: Synopsis */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Synopsis</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              {movie.synopsis || "No synopsis available."}
            </p>
          </div>
        </div>

        {/* Right Column: Rating & Metadata */}
        <div className="space-y-8">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5 space-y-6">
            <div>
              <h3 className="text-sm text-gray-400 font-medium mb-1">
                Rating Summary
              </h3>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold text-white">
                  {movie.rating.toFixed(1)}
                </span>
                <span className="text-lg text-gray-500 mb-1">/ 10</span>
              </div>
              <div className="flex gap-1 mt-2 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Play
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(movie.rating / 2) ? "fill-current" : "fill-gray-700 text-gray-700"} -rotate-90`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Based on IMDb reviews
              </p>
            </div>

            {/* Rating Bars (Mockup for visual) */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-3">{stars}</span>
                  <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${stars === 5 ? 80 : stars * 15}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* No Magnet Popup */}
      {showNoMagnetPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold text-white">
                No Stream Available
              </h3>
              <p className="text-gray-400">
                We couldn't find a magnet link for this movie. Try searching for
                it to find a version with seeders.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-white/20 hover:bg-white/5 hover:text-white"
                onClick={() => setShowNoMagnetPopup(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                onClick={handleSearch}
              >
                Search for seeders
              </Button>
            </div>
          </div>
        </div>
      )}
      <CommentsSection movieId={id} />
    </div>
  );
}
