"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { CheckCircle, XCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import bgImage from "@/public/hero-bg.jpg";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "";

        if (errorMsg === "expired") {
          setStatus("expired");
          setMessage(
            "Your verification link has expired. Please request a new one.",
          );
        } else {
          setStatus("error");
          setMessage(
            errorMsg ||
              "Verification failed. The link may be invalid or expired.",
          );
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      return;
    }

    setIsResending(true);
    setResendSuccess(false);
    try {
      await api.post("/auth/resend-verification", { email });
      setResendSuccess(true);
      setEmail("");
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
          "Failed to resend email. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = () => {
    if (status === "expired") {
      router.push("/signup");
    } else {
      router.push("/login");
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

      <Card className="w-full max-w-md rounded-2xl shadow-lg shadow-black/50 border-border/50 p-0 relative z-10 bg-black/80">
        <CardHeader className="text-center pt-8 pb-6">
          <CardTitle className="text-3xl font-bold">
            Email Verification
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            {status === "loading"
              ? "Verifying your email address..."
              : status === "success"
                ? "Your email has been verified!"
                : status === "expired"
                  ? "Link expired"
                  : "Verification failed"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            {status === "loading" && (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-center text-muted-foreground">{message}</p>
                <p className="text-center text-sm text-muted-foreground">
                  You can now sign in to your account.
                </p>
              </>
            )}

            {status === "expired" && (
              <>
                <XCircle className="w-16 h-16 text-yellow-500" />
                <p className="text-center text-muted-foreground">{message}</p>

                {resendSuccess && (
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Check
                      className="text-emerald-400 flex-shrink-0"
                      size={20}
                    />
                    <p className="text-emerald-400 font-medium">
                      Verification email sent! Please check your inbox.
                    </p>
                  </div>
                )}

                <div className="w-full space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    disabled={isResending}
                  />
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-semibold h-12 rounded-xl"
                  >
                    {isResending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-16 h-16 text-destructive" />
                <p className="text-center text-destructive">{message}</p>
                <p className="text-center text-sm text-muted-foreground">
                  Please try signing up again or contact support if the problem
                  persists.
                </p>
              </>
            )}
          </div>

          {status !== "loading" && status !== "expired" && (
            <Button
              onClick={handleContinue}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold h-12 rounded-xl"
            >
              {status === "success" ? "Continue to Login" : "Back to Home"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
