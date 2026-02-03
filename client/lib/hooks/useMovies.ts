import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Movie } from "../types/Movie";

// Filter parameters matching the YTS API
export interface MovieFilters {
    quality?: string;
    minimum_rating?: number;
    query_term?: string;
    genre?: string;
    sort_by?: 'title' | 'year' | 'rating' | 'peers' | 'seeds' | 'download_count' | 'like_count' | 'date_added';
    order_by?: 'desc' | 'asc';
}

export function useMoviesLibrary(filters: MovieFilters = {}) {
    return useInfiniteQuery<Movie[] | null>({
        queryKey: ["movies", "library", filters],
        queryFn: async ({
            pageParam
        }) => {
            try {
                const { data } = await api.get("/movies/library", {
                    params: {
                        page: pageParam,
                        limit: 20,
                        ...filters,
                    }
                });
                return data as Movie[];
            } catch (error) {
                return null;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < 20) return undefined;
            return allPages.length + 1;
        },
    });
}
