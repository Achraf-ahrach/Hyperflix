"use client"

import { useState } from "react";

// --- Spoiler Text Component ---
export const SpoilerText = ({ text }: { text: string }) => {
  const [revealed, setRevealed] = useState(false);
  const parts = text.split(/(\|\|.*?\|\|)/g);

  return (
    <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
      {parts.map((part, i) => {
        if (part.startsWith('||') && part.endsWith('||')) {
          const content = part.slice(2, -2);
          return (
            <span
              key={i}
              onClick={() => setRevealed(!revealed)}
              className={`cursor-pointer rounded px-1 transition-all mx-0.5 ${
                revealed ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-transparent select-none blur-sm'
              }`}
            >
              {content}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
};
