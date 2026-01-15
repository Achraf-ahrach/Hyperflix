"use client";

import { Hero } from "./hero";
import { Features } from "./features";
import { Trending } from "./trending";
import { Footer } from "./footer";
import { FAQ } from "./faq";

export default function LandingPage() {
  return (
    <div className="bg-black text-white">
      <Hero />
      <Trending />
      <Features />
      <FAQ />
      <Footer />
    </div>
  );
}
