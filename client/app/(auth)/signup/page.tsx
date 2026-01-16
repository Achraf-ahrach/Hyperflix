"use client";

import { useEffect, useState, Suspense } from "react";
import api from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, ArrowRight, User, Mail } from "lucide-react";
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
import Image from "next/image";

function SignUpForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register", { email, username, password });
      router.push("/");
    } catch (err: any) {
      console.error("Registration error:", err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(", ")
          : "Registration failed. Please try again.");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${
      process.env.BACKEND_URL || "http://localhost:3001"
    }/auth/google`;
  };

  const handleFortyTwoSignup = () => {
    window.location.href = `${
      process.env.BACKEND_URL || "http://localhost:3001"
    }/auth/42`;
  };

  // Only show error when user has filled both fields
  const passwordsDoNotMatch =
    password && confirmPassword && password !== confirmPassword;

  useEffect(() => {
    setError("");
  }, [email, username, password, confirmPassword]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage.src})`,
      }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/30 to-black/80" />

      <Card className="w-full min-w-[320px] max-w-md rounded-2xl shadow-lg shadow-black/50 border-border/50 p-0 relative z-10 bg-black/80 ">
        <CardHeader className="text-center pt-8 pb-6 bg-background/50 rounded-br-[25px] rounded-bl-[25px]">
          <CardTitle className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            Sign up to start watching on Hyperflix
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-primary">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-13 bg-card border-border/60 pl-10 group-hover:border-border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-2.5">
              <Label htmlFor="username" className="text-primary">
                Username
              </Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-13 bg-card border-border/60 pl-10 group-hover:border-border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-primary">
                Password
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-13 bg-card border-border/60 group-hover:border-border pr-10 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
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
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2.5">
              <Label
                htmlFor="confirmPassword"
                className={`transition-colors ${
                  passwordsDoNotMatch ? "text-destructive" : "text-primary"
                }`}
              >
                Confirm Password
              </Label>
              <div className="relative group">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={`h-13 bg-card border-border/60 group-hover:border-border pr-10 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    passwordsDoNotMatch
                      ? "border-destructive/70 focus-visible:ring-destructive/30"
                      : "focus-visible:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 disabled:opacity-50"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error Message - Only show if passwords don't match or general error */}
              {(passwordsDoNotMatch || error) && (
                <div className="flex items-start gap-2 text-destructive text-xs mt-2 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {passwordsDoNotMatch ? "Passwords do not match" : error}
                  </span>
                </div>
              )}
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-display font-semibold h-12 rounded-xl shadow-glow transition-all duration-200 transform active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-white">
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
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
              onClick={handleFortyTwoSignup}
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
              onClick={handleGoogleSignup}
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

        <CardFooter className="flex justify-center py-4">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary font-bold hover:opacity-70 transition-opacity"
            >
              Sign In
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
