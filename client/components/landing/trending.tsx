import Image from "next/image";
import { ChevronRight } from "lucide-react";

const trendingItems = [
  { id: 1, title: "Man vs Baby", image: "/movies/movie_1.png" },
  { id: 2, title: "The Great Flood", image: "/movies/movie_2.png" },
  { id: 3, title: "Stranger Things", image: "/movies/movie_3.png" },
  { id: 4, title: "Emily in Paris", image: "/movies/movie_4.png" },
  { id: 5, title: "The Reckoning", image: "/movies/movie_5.png" },
  { id: 6, title: "Squid Game", image: "/movies/movie_6.png" },
];

export function Trending() {
  return (
    <section className="relative px-4 md:px-8 lg:px-44 py-12">
      <h2 className="text-xl md:text-2xl font-bold mb-8">Trending Now</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {trendingItems.map((item, index) => (
          <div
            key={item.id}
            className="relative aspect-[2/3] group cursor-pointer"
          >
            <div className="absolute -left-8 md:-left-10 lg:-left-12 bottom-[-10px] md:bottom-[-15px] z-20 select-none">
              <span
                className="text-[80px] md:text-[120px] lg:text-[160px] font-black leading-none drop-shadow-md"
                style={{
                  WebkitTextStroke: "2px rgba(255,255,255,0.8)",
                  color: "black",
                }}
              >
                {index + 1}
              </span>
            </div>

            <div className="w-full h-full rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer relative z-10 shadow-2xl">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
