import { Calendar, Star } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Movie } from "@/types/profile/profile";
import { useRouter } from "next/navigation";

export const MovieCard = ({ movie }: { movie: Movie }) => {
    const router = useRouter();

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => {router.push(`/movie/${movie.id}`)}}>
            <div className="aspect-[2/3] bg-muted relative overflow-hidden">
                {/* <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background/40 group-hover:opacity-80 transition-opacity" /> */}
                <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-2 line-clamp-1">{movie.title}</h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{movie.year}</span>
          {/* <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="font-medium">{movie.rating}</span>
          </div> */}
        </div>
        {movie.watchedDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{movie.watchedDate}</span>
          </div>
        )}
      </CardContent>
    </Card>)
}