import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Movie } from "../types/Movie";

interface SearchResponse {
    query: string;
    count: number;
    results: Movie[];
}

export function useSearchMovies(query: string) {
    return useQuery<SearchResponse>({
        queryKey: ["movies", "search", query],
        queryFn: async () => {
            if (!query) return { query: "", count: 0, results: [] };
            const { data } = await api.get("/movies/search", {
                params: {
                    q: query,
                }
            });
            return data;
        },
        enabled: !!query && query.length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
