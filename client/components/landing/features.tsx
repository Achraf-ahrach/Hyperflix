"use client";

import { Sparkles, Clapperboard, MessageCircle, Monitor } from "lucide-react";

const features = [
  {
    title: "See what others think",
    description:
      "Read comments and reviews from other people on the movies you love. Discover opinions and ratings from the community.",
    icon: MessageCircle,
  },
  {
    title: "Always 100% Free",
    description:
      "Welcome to instant gratification at its best. Watch now without any payment or subscription and end the search for free movie websites.",
    icon: Sparkles,
  },
  {
    title: "Watch everywhere",
    description:
      "Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.",
    icon: Monitor,
  },
  {
    title: "Thousands of Titles",
    description:
      "Choose from movies, shows, sports and music documentaries, AMC series, Live TV and more.",
    icon: Clapperboard,
  },
];

export function Features() {
  return (
    <section className="px-4 md:px-8 lg:px-44 py-12">
      <h2 className="text-xl md:text-2xl font-bold mb-6">
        More Reasons to Join
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, i) => (
          <div
            key={i}
            className="bg-linear-to-br from-[#19223d] to-[#0f111a] p-6 pb-20 rounded-2xl relative overflow-hidden group hover:from-[#1e294a] transition-all duration-300"
          >
            <h3 className="text-xl font-bold mb-3 tracking-tight leading-snug">
              {feature.title}
            </h3>
            <p className="text-[#a0a4b8] text-sm leading-relaxed">
              {feature.description}
            </p>
            <div className="absolute bottom-4 right-4 text-white/20 group-hover:text-red-600/30 transition-colors">
              <feature.icon className="w-14 h-14" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
