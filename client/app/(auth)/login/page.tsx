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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/auth/login", { email, password });
      router.push("/home");
    } catch (err) {
      setError("Incorrect password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${
      process.env.BACKEND_URL || "http://localhost:3001"
    }/auth/google`;
  };

  const handleFortyTwoLogin = () => {
    window.location.href = `${
      process.env.BACKEND_URL || "http://localhost:3001"
    }/auth/42`;
  };

  useEffect(() => {
    setError("");
  }, [email, password]);

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
            {/* Email Field */}
            <div className="space-y-2.5">
              <Label htmlFor="email" className="  text-primary">
                Email Address
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="text"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                href="#"
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
          <div className="grid grid-cols-2 gap-3">
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
