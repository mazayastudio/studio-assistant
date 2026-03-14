"use client";

import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex w-full animate-message-in justify-start">
      <div className="flex max-w-[75%] flex-col gap-1 md:max-w-[65%]">
        {/* Avatar + Name */}
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
            }}
          >
            SA
          </div>
          <span>Studio Assistant</span>
        </div>

        {/* Typing Dots Bubble */}
        <div
          className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-5 py-4"
          style={{
            background: "var(--assistant-bubble)",
            border: "1px solid var(--border-color)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background: "var(--accent-primary)",
                animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
