"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import bgImage from "@/public/hero-bg.jpg";
import { useUser } from "@/lib/contexts/UserContext";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refetch } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/auth/login", { identifier, password });
      await refetch();
      router.push("/home");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Incorrect password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/auth/google`;
  };

  const handleFortyTwoLogin = () => {
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/auth/42`;
  };

  const handleGitHubLogin = () => {
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/auth/github`;
  };

  useEffect(() => {
    setError("");
  }, [identifier, password]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage.src})`,
      }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/80" />
      <Card className="w-full min-w-[320px] max-w-md rounded-2xl shadow-lg shadow-black/50 border-border/50 p-0 relative z-10 bg-black/80 ">
        <CardHeader className="text-center pt-8 pb-6 bg-background/50 rounded-br-[25px] rounded-bl-[25px] rounded-tr-2xl rounded-tl-2xl">
          <CardTitle className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            Sign in to continue to Hyperflix
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="identifier" className="  text-primary">
                Email Address or Username
              </Label>
              <div className="relative group">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="mail@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-13 bg-card border-border/60 group-hover:border-border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2.5">
              <Label
                htmlFor="password"
                className={`transition-colors ${
                  error ? "text-destructive" : "text-primary"
                }`}
              >
                Password
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="****************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={`h-13 bg-card border-border/60 group-hover:border-border pr-10 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    error
                      ? "border-destructive/70 focus-visible:ring-destructive/30"
                      : "focus-visible:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 disabled:opacity-50"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 text-destructive text-xs mt-2 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end pt-2">
              <a
                href="forgot-password"
                className="text-primary mb-2 text-sm font-medium hover:opacity-70 transition-opacity"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-display font-semibold h-12 rounded-xl shadow-glow transition-all duration-200 transform active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-white ">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 while group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50"></span>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-black/70 px-0.5 text-xs uppercase text-muted-foreground font-bold tracking-wide">
                OR
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleFortyTwoLogin}
              disabled={isLoading}
              className="border-border/60 hover:border-primary flex items-center justify-center gap-2 h-11 bg-surface hover:bg-[#2D3B55] text-text-head rounded-xl font-medium text-sm border border-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/20"
            >
              <Image
                src="/42_Logo.png"
                alt="42 Logo"
                width={20}
                height={20}
                className="w-6 h-6"
              />
              <span>Intra</span>
            </button>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className=" border-border/60 hover:border-primary flex items-center justify-center gap-2 h-11 bg-surface hover:bg-[#2D3B55] text-text-head rounded-xl font-medium text-sm border border-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/20"
            >
              <Image
                src="/Google_logo.png"
                alt="Google Logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span>Google</span>
            </button>

            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="border-border/60 hover:border-primary flex items-center justify-center gap-2 h-11 bg-surface hover:bg-[#2D3B55] text-text-head rounded-xl font-medium text-sm border border-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/20"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center py-4  ">
          <p className="text-muted-foreground text-sm ">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-primary font-bold hover:opacity-70 transition-opacity"
            >
              Sign Up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
