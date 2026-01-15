"use client";

import { Github } from "lucide-react";
import Image from "next/image";

const teamMembers = [
  {
    name: "Achraf",
    github: "https://github.com/Achraf-ahrach",
  },
  {
    name: "Yassir",
    github: "https://github.com/elyassir",
  },
  {
    name: "Zakaria",
    github: "https://github.com/lazrak-zakaria",
  },
  {
    name: "Youssef",
    github: "https://github.com/JosepharDev",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-16 mt-20">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        {/* Top section with logo and description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <div className="mb-6">
              <Image
                src="/logo_.png"
                alt="Hyperflix Logo"
                width={300}
                height={80}
                className="h-20 w-auto object-contain"
              />
              <p className="text-muted-foreground mt-4">
                Your ultimate streaming experience with unlimited entertainment.
              </p>
            </div>
          </div>

          {/* Team section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">
              Built by
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {teamMembers.map((member) => (
                <a
                  key={member.name}
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                >
                  <Github
                    size={16}
                    className="text-muted-foreground group-hover:text-accent-foreground"
                  />
                  <span className="text-sm text-foreground group-hover:text-accent-foreground font-medium">
                    {member.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8"></div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Copyright © 2026 Hyperflix. All rights reserved.
            </p>
          </div>

          {/* GitHub project link */}
          <a
            href="https://github.com/Achraf-ahrach/Hyperflix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-accent transition-colors group"
          >
            <Github
              size={18}
              className="text-muted-foreground group-hover:text-accent-foreground"
            />
            <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
              View on GitHub
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
