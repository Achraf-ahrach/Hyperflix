"use client";

import LandingPage from "@/components/landing/LandingPage";
import { useUser } from "@/lib/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isLoading && user) {
  //     router.replace("/home");
  //   }
  // }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <LandingPage />;
}
