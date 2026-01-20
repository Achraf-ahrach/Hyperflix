import { Movie } from "../types/types";



// MovieCard Component
export const MovieCard: React.FC<{ movie: Movie; isWatchLater?: boolean }> = ({ 
  movie, 
  isWatchLater = false 
}) => {
  return (
    <div className="group relative bg-zinc-900 overflow-hidden transition-transform duration-200 hover:scale-105">
      {isWatchLater && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-600 text-black px-2 py-1 text-xs font-semibold">
          WATCH LATER
        </div>
      )}

      <div className="aspect-[2/3] overflow-hidden bg-zinc-800">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{movie.title}</h3>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">{movie.year}</span>
          <div className="flex items-center gap-1">
            <span>⭐</span>
            {/* <span className="text-white font-medium">{movie.rating.toFixed(1)}</span> */}
          </div>
        </div>
      </div>
    </div>
  );
};
