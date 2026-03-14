"use client";

import React, { useRef, useEffect, useState } from "react";

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
  const [showHints, setShowHints] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Show command hints when user types "/"
  useEffect(() => {
    const trimmed = value.trimStart();
    if (trimmed.startsWith("/") && !trimmed.includes("[")) {
      setShowHints(true);
    } else {
      setShowHints(false);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }
    // Close hints on Escape
    if (e.key === "Escape") {
      setShowHints(false);
    }
  };

  const handleSelectHint = (template: string) => {
    onChange(template);
    setShowHints(false);
    textareaRef.current?.focus();
  };

  // Filter hints based on current input
  const filteredHints = COMMAND_HINTS.filter((h) =>
    h.command.startsWith(value.trimStart().split(" ")[0].toLowerCase())
  );

  return (
    <div
      className="relative w-full px-4 pb-4 pt-2 md:px-6"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Command hints dropdown */}
      {showHints && filteredHints.length > 0 && (
        <div
          className="absolute bottom-full left-4 right-4 z-10 mb-2 overflow-hidden rounded-xl md:left-6 md:right-6"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <div className="px-3 py-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Commands
            </span>
          </div>
          {filteredHints.map((hint) => (
            <button
              key={hint.command}
              onClick={() => handleSelectHint(hint.template)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors duration-150"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-tertiary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span className="mt-0.5 text-base">{hint.icon}</span>
              <div className="flex flex-col gap-0.5">
                <code
                  className="text-xs font-medium"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {hint.template}
                </code>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {hint.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

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
          placeholder={isLoading ? "Waiting for response..." : "Type a message or / for commands..."}
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
