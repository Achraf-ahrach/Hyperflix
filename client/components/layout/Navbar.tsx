"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import ModeToggle from "../shared/mode-toggle";
import { useUser } from "@/lib/contexts/UserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Navbar() {
  const router = useRouter();
  const { user, refetch } = useUser();
  const queryClient = useQueryClient();

  const logoutMutaion = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: ["auth", "profile"] }, null);
      queryClient.removeQueries({ queryKey: ["auth"] });
      // refetch();
      router.push("/login");
    },
  });

  const handleLogout = async () => {
    logoutMutaion.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.username) return user.username.substring(0, 2).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center px-6">
        <Image
          src="/logo_.png"
          alt="Hyperflix Logo"
          width={140}
          height={40}
          priority
          className="w-32 md:w-44 lg:w-48 object-contain"
        />

        {/* Search Bar - Wide center area */}
        <div className="flex-1 max-w-xl mx-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const query = formData.get("q") as string;
            if (query?.trim()) {
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }
          }} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Search..."
              className="w-full bg-card border border-border pl-9 focus-visible:ring-primary"
            />
          </form>
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Language Toggle (Simplification) */}
          {/* <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            EN
          </Button> */}

          <ModeToggle />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage
                    src={user?.avatarUrl || undefined}
                    alt={user?.username || "User"}
                  />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-card border-border text-foreground"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.username || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => router.push(`/profile/${user?.id}`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
