
"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import bgImage from "@/public/hero-bg.jpg";


export function FailedVerification() {
  const router = useRouter();
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <Card className="w-full max-w-md rounded-2xl shadow-lg shadow-black/50 border-border/50 p-0 relative z-10 bg-black/80">
        <CardHeader className="text-center pt-8 pb-6">
          <CardTitle className="text-3xl font-bold">Verification Failed</CardTitle>
          <CardDescription className="text-sm mt-2">Link expired</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 pb-8">
          <XCircle className="w-16 h-16 text-yellow-500" />
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold h-12 rounded-xl"
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
