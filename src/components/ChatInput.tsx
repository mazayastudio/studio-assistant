"use client";

import React, { useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const COMMAND_HINTS = [
  {
    command: "/write-dialogue",
    template: "/write-dialogue [character] [scenario]",
    description: "Generate professional game dialogue",
    icon: "🎭",
  },
  {
    command: "/asset-description",
    template: "/asset-description [type] [style]",
    description: "Generate visual asset description for art team",
    icon: "🎨",
  },
];

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derived — no state needed
  const showHints = (() => {
    const trimmed = value.trimStart();
    return trimmed.startsWith("/") && !trimmed.includes("[");
  })();

  // Auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) onSend();
    }
    if (e.key === "Escape") { /* hints hide automatically as input changes */ }
  };

  const handleSelectHint = (template: string) => {
    onChange(template);
    textareaRef.current?.focus();
  };

  const filteredHints = COMMAND_HINTS.filter((h) =>
    h.command.startsWith(value.trimStart().split(" ")[0].toLowerCase())
  );

  const canSend = !!value.trim() && !isLoading;

  return (
    /* ChatGPT-style: wide padded area, centered input container */
    <div className="relative w-full bg-zinc-950 px-4 pb-6 pt-4 md:px-6">
      {/* command hints */}
      {showHints && filteredHints.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 z-10 mb-3 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl md:left-6 md:right-6">
          <div className="px-5 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Commands
            </span>
          </div>
          {filteredHints.map((hint) => (
            <button
              key={hint.command}
              onClick={() => handleSelectHint(hint.template)}
              className="flex w-full items-start gap-4 border-t border-zinc-800 px-5 py-4 text-left transition-colors hover:bg-zinc-800"
            >
              <span className="text-xl">{hint.icon}</span>
              <div className="flex flex-col gap-1">
                <code className="text-sm font-medium text-zinc-100">{hint.template}</code>
                <span className="text-[13px] text-zinc-400">{hint.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input box — ChatGPT-style rounded container */}
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-3 rounded-2xl border border-zinc-700 bg-zinc-800 px-5 py-3.5 shadow-lg transition-all duration-150 focus-within:border-zinc-500">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Waiting for response…" : "Message Studio Assistant…"}
            disabled={isLoading}
            rows={1}
            className="max-h-[200px] flex-1 resize-none bg-transparent text-[16px] leading-7 text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            onClick={onSend}
            disabled={!canSend}
            className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
              canSend
                ? "bg-white text-zinc-900 hover:bg-zinc-100"
                : "cursor-not-allowed bg-zinc-700 text-zinc-500"
            }`}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12L12 5L19 12" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-center text-[12px] text-zinc-600">
          Studio Assistant may produce inaccurate information. Use with discretion.
        </p>
      </div>
    </div>
  );
}
