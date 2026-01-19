"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  provider: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
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
    staleTime: 5 * 60 * 1000, // 5m
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  return (
    <UserContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isError,
        refetch,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
