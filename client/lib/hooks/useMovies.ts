import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Movie } from "../types/Movie";

export function useMoviesLibrary() {
    return useInfiniteQuery<Movie[] | null>({
        queryKey: ["movies", "library"],
        queryFn: async ({
            pageParam
        }) => {
            try {
                const { data } = await api.get("/movies/library", {
                    params: {
                        page: pageParam,
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
            if (!lastPage || lastPage.length < 10) return undefined;
            return allPages.length + 1;
        },
        // getPreviousPageParam: (firstPage, allPages) => {
        //     if (firstPage.length < 10) return undefined;
        //     return allPages.length + 1;
        // }
    });

}
