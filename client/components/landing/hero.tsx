"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Languages } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="relative min-h-[700px] lg:h-[95vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.jpg"
          alt="Movie Grid Background"
          fill
          className="object-cover object-center opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
      </div>

      <nav className="relative z-20 flex items-center justify-between px-4 py-6 md:px-12 lg:px-32">
        <Image
          src="/logo_.png"
          alt="Hyperflix Logo"
          width={160}
          height={48}
          priority
          className="w-42 md:w-54"
        />
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-white/30 rounded bg-black/20 backdrop-blur-sm text-white">
            <Languages className="w-4 h-4 text-white" />
            <select className="bg-transparent text-sm font-medium outline-none cursor-pointer text-white">
              <option className="bg-black text-white">English</option>
              <option className="bg-black text-white">Français</option>
            </select>
          </div>
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 h-auto text-sm">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 max-w-4xl mx-auto -mt-16">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-balance leading-[1.1] text-white">
          Unlimited movies, TV shows, and more
        </h1>
        <p className="mt-6 text-xl md:text-2xl font-medium text-white">
          Watch anywhere. 100% Free. No subscription required.
        </p>
        <p className="mt-8 text-lg md:text-xl max-w-2xl text-gray-300">
          Ready to watch? Enter your email to get started and enjoy free
          streaming.
        </p>

        <div className="mt-8 flex flex-col md:flex-row items-stretch gap-2 w-full max-w-2xl">
          <Input
            type="email"
            placeholder="Email address"
            className="bg-black/40 border-white/30 text-white placeholder:text-gray-400 h-14 md:h-16 text-lg focus:border-white transition-colors"
          />
          <Link href="/signup">
            <Button className="bg-red-600 hover:bg-red-700 h-14 md:h-16 px-8 text-xl md:text-2xl font-bold flex items-center gap-2 shrink-0">
              Get Started <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black to-transparent pointer-events-none z-20" />
      <div className="absolute -bottom-px left-[-10%] right-[-10%] h-[120px] rounded-[100%] border-t-4 border-[#e50914]" />
    </div>
  );
}
