"use client";

import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex w-full animate-message-in gap-4 py-1">
      {/* AI avatar */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-900">
        SA
      </div>

      {/* Typing dots */}
      <div className="flex-1 pb-2 pt-2.5">
        <p className="mb-3 text-[13px] font-semibold text-zinc-400">Studio Assistant</p>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 rounded-full bg-zinc-400"
              style={{ animation: `elegantPulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
