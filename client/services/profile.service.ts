
import api from '@/lib/axios';
import axios from 'axios';


const LIMIT = 15;
export const profileService = {

    apiCall: async (endpoint: string) => {
        try {
            console.log("Fetching comments with endpoint:", endpoint);
            const response = await api.get(endpoint);
            console.log("Received response:", response.data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error.response?.data ?? new Error("Failed to get comments");
            }
            throw new Error("Unexpected error occurred");
        }
    },

    getComments: async (data: any) => {
        let endpoint = `/profile/${data.userId}/comments?page=${data.pageNum}&limit=${LIMIT}`;
        return await profileService.apiCall(endpoint);
    },

    getMovies: async (data: any) => {
        let endpoint = `/profile/${data.userId}/movies?page=${data.pageNum}&limit=${LIMIT}`;
        return await profileService.apiCall(endpoint);
    },

    getWatchLater: async (data: any) => {
        let endpoint = `/profile/${data.userId}/movies/watch-later?page=${data.pageNum}&limit=${LIMIT}`;
        return await profileService.apiCall(endpoint);
    },
    
    getUserData: async (userId: number) => {
        let endpoint = `/profile/${userId}`;
        return await profileService.apiCall(endpoint);
    }
};