"use client";

import Navbar from "@/components/layout/Navbar";
import { Toaster } from "sonner";
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="antialiased bg-background min-h-screen text-foreground">
      {/* <Toaster /> */}
      <Toaster
      // theme="dark" 
          position="top-center"
          richColors
          // toastOptions={{
          //   classNames: {
          //     toast: "rounded-lg shadow-lg",
          //     success: "bg-green-600 text-white",
          //     error: "bg-red-600 text-white",
          //     warning: "bg-yellow-500 text-black",
          //     info: "bg-blue-600 text-white",
          //   },
          // }}
        />
      <Navbar />
      
      {children}
    </div>
  );
}
