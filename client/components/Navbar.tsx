"use client";

import Link from "next/link";
import { Search, Bell, LogOut, User, Settings } from "lucide-react";
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
import ModeToggle from "./mode-toggle";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api
      .get("/auth/profile")
      .then(({ data }) => setUser(data))
      .catch(() => {
        // User not authenticated
        setUser(null);
      });
  }, []);

  console.log("userData: ", user);

  const handleLogout = async () => {
    await api.post("/auth/logout");
    router.push("/login");
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.username) return user.username.substring(0, 2).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center px-6">
        {/* Logo */}
        <Link
          href="/library"
          className="mr-8 flex items-center gap-2 font-bold text-xl text-primary hover:text-primary/80 transition"
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            H
          </div>
          <span className="hidden md:inline-block">Hyperflix</span>
        </Link>

        {/* Search Bar - Wide center area */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-card border border-border pl-9 focus-visible:ring-primary"
            />
          </div>
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
                    src={user?.avatarUrl}
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
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
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
