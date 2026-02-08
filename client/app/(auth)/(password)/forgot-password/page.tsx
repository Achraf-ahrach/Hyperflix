"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import bgImage from "@/public/hero-bg.jpg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage.src})`,
      }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/80" />

      <Card className="w-full min-w-[320px] max-w-md rounded-2xl shadow-lg shadow-black/50 border-border/50 p-0 relative z-10 bg-black/80">
        <CardHeader className="text-center pt-8 pb-6 bg-background/50 rounded-br-[25px] rounded-bl-[25px] rounded-tr-2xl rounded-tl-2xl">
          <CardTitle className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {isSuccess ? "Check Your Email" : "Forgot Password?"}
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            {isSuccess
              ? "We've sent you a password reset link"
              : "Enter your email to reset your password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-8 pb-8">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-muted-foreground">
                If an account exists with <strong>{email}</strong>, you will
                receive a password reset link shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and spam folder.
              </p>
              <Link href="/login">
                <Button className="w-full bg-primary hover:bg-primary-hover">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-primary">
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="mail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-13 bg-card border-border/60 group-hover:border-border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-display font-semibold h-12 rounded-xl shadow-glow transition-all duration-200 transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Send Reset Link</span>
                  </div>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:opacity-70 transition-opacity inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
