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

  if (isUser) {
    return (
      <div className="flex w-full animate-message-in justify-end py-1">
        {/* User pill bubble */}
        <div className="max-w-[70%] rounded-3xl bg-zinc-700 px-5 py-3.5 text-[16px] leading-7 text-zinc-100">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full animate-message-in gap-4 py-1">
      {/* AI avatar */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-900">
        SA
      </div>

      {/* AI message — no bubble, just text */}
      <div className="flex-1 pb-2 pt-1">
        <p className="mb-1 text-[13px] font-semibold text-zinc-400">Studio Assistant</p>
        <div className="text-[16px] leading-8 text-zinc-100">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h3 className="mb-3 mt-6 text-lg font-bold text-zinc-50 first:mt-0">{children}</h3>
              ),
              h2: ({ children }) => (
                <h4 className="mb-2 mt-5 text-base font-bold text-zinc-50 first:mt-0">{children}</h4>
              ),
              h3: ({ children }) => (
                <h5 className="mb-2 mt-4 text-base font-semibold text-zinc-100 first:mt-0">{children}</h5>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-8 last:mb-0">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-50">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-zinc-300">{children}</em>
              ),
              code: ({ className, children, ...props }) => {
                if (className?.includes("language-")) {
                  return (
                    <code className={`block ${className ?? ""}`} {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className="rounded-md bg-zinc-800 px-2 py-0.5 text-sm font-mono text-zinc-200"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-4 overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-sm leading-6 font-mono text-zinc-200">
                  {children}
                </pre>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 ml-6 list-disc space-y-1.5 last:mb-0">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 ml-6 list-decimal space-y-1.5 last:mb-0">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-8 text-zinc-200">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-4 border-zinc-600 pl-5 italic text-zinc-300">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-6 border-zinc-700" />,
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto rounded-xl border border-zinc-700">
                  <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border-b border-zinc-700 bg-zinc-800 px-5 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-zinc-800 px-5 py-3 text-zinc-300 last:border-0">
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <span className="mt-2 block text-[11px] text-zinc-600">{message.timestamp}</span>
      </div>
    </div>
  );
}
