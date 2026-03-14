"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Headings
                  h1: ({ children }) => (
                    <h3 className="mb-2 mt-3 text-base font-bold first:mt-0" style={{ color: "var(--text-primary)" }}>
                      {children}
                    </h3>
                  ),
                  h2: ({ children }) => (
                    <h4 className="mb-1.5 mt-2.5 text-sm font-bold first:mt-0" style={{ color: "var(--text-primary)" }}>
                      {children}
                    </h4>
                  ),
                  h3: ({ children }) => (
                    <h5 className="mb-1 mt-2 text-sm font-semibold first:mt-0" style={{ color: "var(--text-primary)" }}>
                      {children}
                    </h5>
                  ),
                  // Paragraph
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  // Bold
                  strong: ({ children }) => (
                    <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {children}
                    </strong>
                  ),
                  // Italic
                  em: ({ children }) => (
                    <em className="italic" style={{ color: "var(--text-secondary)" }}>
                      {children}
                    </em>
                  ),
                  // Inline code
                  code: ({ className, children, ...props }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <code className={`block ${className ?? ""}`} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code
                        className="rounded px-1.5 py-0.5 text-xs font-mono"
                        style={{
                          background: "rgba(124, 92, 252, 0.15)",
                          color: "var(--accent-primary)",
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // Code block
                  pre: ({ children }) => (
                    <pre
                      className="my-2 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed font-mono"
                      style={{
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {children}
                    </pre>
                  ),
                  // Lists
                  ul: ({ children }) => (
                    <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  // Blockquote
                  blockquote: ({ children }) => (
                    <blockquote
                      className="my-2 rounded-r-lg border-l-2 pl-3 italic"
                      style={{
                        borderColor: "var(--accent-primary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {children}
                    </blockquote>
                  ),
                  // Horizontal rule
                  hr: () => (
                    <hr className="my-3" style={{ borderColor: "var(--border-color)" }} />
                  ),
                  // Links
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 transition-colors hover:opacity-80"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {children}
                    </a>
                  ),
                  // Tables
                  table: ({ children }) => (
                    <div className="my-2 overflow-x-auto">
                      <table
                        className="w-full text-xs"
                        style={{ borderCollapse: "collapse" }}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th
                      className="px-3 py-1.5 text-left font-semibold"
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td
                      className="px-3 py-1.5"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      {children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
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
