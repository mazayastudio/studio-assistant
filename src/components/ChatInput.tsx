"use client";

import React, { useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }
  };

  return (
    <div
      className="w-full px-4 pb-4 pt-2 md:px-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
        style={{
          background: "var(--input-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: value.trim() ? "var(--shadow-glow)" : "none",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Waiting for response..." : "Type a message..."}
          disabled={isLoading}
          rows={1}
          className="max-h-[150px] flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ color: "var(--text-primary)" }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
          style={{
            background:
              value.trim() && !isLoading
                ? "var(--accent-gradient)"
                : "var(--bg-tertiary)",
          }}
          aria-label="Send message"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
      <p
        className="mx-auto mt-2 max-w-3xl text-center text-[10px]"
        style={{ color: "var(--text-muted)" }}
      >
        Studio Assistant may produce inaccurate information. Use with discretion.
      </p>
    </div>
  );
}
