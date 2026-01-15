"use client";

import Navbar from "@/components/layout/Navbar";
import LandingPage from "@/components/landing/LandingPage";
import { useUser } from "@/lib/contexts/UserContext";

function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="antialiased bg-background min-h-screen text-foreground">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p>Welcome back, {user?.username}!</p>
      </main>
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  return user ? <DashboardPage /> : <LandingPage />;
}
