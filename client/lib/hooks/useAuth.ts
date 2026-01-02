import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  provider: string;
}

export function useAuth() {
  return useQuery<User | null>({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/auth/profile");
        return data;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
