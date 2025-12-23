"use client";
import Navbar from "@/components/Navbar";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch Profile
    // The browser automatically attaches the 'Authentication' cookie here.
    api.get("/auth/profile")
      .then(({ data }) => setUser(data))
      .catch(() => {
        // If the backend says 401 (Unauthorized), redirect to login
        router.push("/login");
      });
  }, [router]);


  if (!user) return <p className="p-10">Loading...</p>;

  return (
    <div className="p-10">
    </div>
  );
}

export default function Home() {
  return (
    <div className="antialiased bg-background min-h-screen text-foreground">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <DashboardPage />
      </main>
    </div>
  );
}
