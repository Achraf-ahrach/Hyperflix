"use client";

import Navbar from "@/components/layout/Navbar";
import { useUser } from "@/lib/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isLoading && !user) {
  //     router.push("/");
  //   }
  // }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // if (!user) {
  //   return null;
  // }

  return (
    <div className="antialiased bg-background min-h-screen text-foreground">
      <Navbar />
      {children}
    </div>
  );
}
