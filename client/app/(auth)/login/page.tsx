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
      router.push("/");
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
              className="border-border/60 hover:border-primary flex items-center justify-center gap-2 h-11 bg-surface hover:bg-[#2D3B55] text-text-head rounded-xl font-medium text-sm border border-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/42_Logo.svg/1024px-42_Logo.svg.png"
                alt="42 Logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span>Intra</span>
            </button>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className=" border-border/60 hover:border-primary flex items-center justify-center gap-2 h-11 bg-surface hover:bg-[#2D3B55] text-text-head rounded-xl font-medium text-sm border border-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.19 21.1039L16.323 18.1056C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.50253 14.3003C5.00236 12.8199 5.00236 11.1799 5.50253 9.69951V6.60861H1.5166C-0.18551 10.0056 -0.18551 13.9945 1.5166 17.3915L5.50253 14.3003Z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.60861L5.50253 9.69951C6.45064 6.86154 9.10947 4.74966 12.24 4.74966Z"
                  fill="#EA4335"
                ></path>
              </svg>
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
