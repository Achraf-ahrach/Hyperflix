"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight, Languages, CircleX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Hero() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log("Submitted email:", email);
    if (!email || !email.includes("@")) {
      console.log("Please enter a valid email address.\n\n");
      setError("Please enter a valid email address.");
      return;
    }
    router.push(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="relative min-h-[700px] lg:h-[95vh] h-[50vh] w-full overflow-hidden font-sans">
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.jpg"
          alt="Movie Grid Background"
          fill
          className="object-cover object-center opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/40 to-black" />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-4 py-6 md:px-12 lg:px-32">
        <Image
          src="/logo_.png"
          alt="Hyperflix Logo"
          width={140}
          height={40}
          priority
          className="w-32 md:w-44 lg:w-48 object-contain"
        />
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button className="bg-[#e50914] hover:bg-[#c11119] text-white font-medium px-6 py-2 h-auto text-md rounded-md transition-colors">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 max-w-5xl mx-auto -mt-16">
        <h1 className="text-4xl md:text-6xl lg:text-[4rem] font-black tracking-tight text-balance leading-[1.1] text-white drop-shadow-lg">
          Unlimited movies, TV shows, and more
        </h1>
        <p className="mt-4 text-xl md:text-2xl font-normal text-white drop-shadow-md">
          Watch anywhere. Cancel anytime.
        </p>
        <p className="mt-6 text-lg md:text-xl font-normal max-w-2xl text-white/90 drop-shadow-md">
          Ready to watch? Enter your email to create or restart your membership.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col md:flex-row items-stretch gap-3 w-full max-w-2xl px-4 md:px-0"
        >
          <div className="relative flex-1 group">
            <input
              id="email-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value) setError("");
              }}
              required
              placeholder=" "
              className={`
                block w-full rounded-md border 
                bg-black/60 backdrop-blur-sm 
                px-5 pt-6 pb-2 text-white text-lg
                h-12 md:h-14 lg:h-16
                focus:outline-none focus:ring-0 peer
                transition-all duration-200
                ${
                  error
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-500 focus:border-white"
                }
              `}
            />

            <label
              htmlFor="email-input"
              className={`
                absolute text-gray-400 duration-150 transform 
                top-4 z-10 origin-left left-5 
                
=                scale-75 -translate-y-3
                
                peer-placeholder-shown:scale-100 
                peer-placeholder-shown:translate-y-0 
                
                peer-focus:scale-75 
                peer-focus:-translate-y-3
              `}
            >
              Email address
            </label>

            {error && (
              <div className="absolute -bottom-7 left-1 flex items-center gap-2 text-[#eb3942]">
                <CircleX className="w-4 h-4" />
                <span className="text-sm font-normal">
                  Please enter a valid email address.
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="bg-[#e50914] hover:bg-[#c11119] h-12 md:h-14 lg:h-16 px-6 md:px-8 text-xl md:text-2xl font-bold text-white rounded-md flex items-center gap-2 shrink-0 transition-colors"
          >
            Get Started <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </Button>
        </form>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black to-transparent pointer-events-none z-20" />
      <div className="absolute -bottom-px left-[-10%] right-[-10%] h-[120px] rounded-[100%] border-t-4 border-[#e50914]/60" />
      <div className="absolute -bottom-px left-[-10%] right-[-10%] h-[100px] rounded-[100%] border-t-4 border-[#e50914] opacity-70 blur-md z-0" />
    </div>
  );
}
