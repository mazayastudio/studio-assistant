"use client";

import React from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full animate-message-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className="flex max-w-[75%] flex-col gap-1 md:max-w-[65%]">
        {/* Avatar + Name */}
        <div
          className={`flex items-center gap-2 text-xs ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
          style={{ color: "var(--text-muted)" }}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
              isUser
                ? "bg-gradient-to-br from-[#7c5cfc] to-[#5a8cfc] text-white"
                : "text-white"
            }`}
            style={!isUser ? { background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" } : {}}
          >
            {isUser ? "U" : "SA"}
          </div>
          <span>{isUser ? "You" : "Studio Assistant"}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser ? "rounded-tr-sm" : "rounded-tl-sm"
          }`}
          style={{
            background: isUser ? "var(--user-bubble)" : "var(--assistant-bubble)",
            color: isUser ? "#ffffff" : "var(--text-primary)",
            border: isUser ? "none" : "1px solid var(--border-color)",
          }}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <span
          className={`text-[10px] ${isUser ? "text-right" : "text-left"}`}
          style={{ color: "var(--text-muted)" }}
        >
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
