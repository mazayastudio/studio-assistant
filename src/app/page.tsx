"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ChatMessage, { Message } from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import ChatSidebar, { ChatHistoryEntry } from "@/components/ChatSidebar";

interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: string;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const STORAGE_KEYS = {
  sessions: "studio-assistant-sessions",
  activeChatId: "studio-assistant-active-chat",
} as const;

function loadFromSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Load from sessionStorage on mount ───
  useEffect(() => {
    setSessions(loadFromSession(STORAGE_KEYS.sessions, []));
    setActiveChatId(loadFromSession(STORAGE_KEYS.activeChatId, null));
    setIsClient(true);
  }, []);

  // ─── Persist to sessionStorage on changes ───
  useEffect(() => {
    if (!isClient) return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
    } catch { /* storage full — silently ignore */ }
  }, [sessions, isClient]);

  useEffect(() => {
    if (!isClient) return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.activeChatId, JSON.stringify(activeChatId));
    } catch { /* silently ignore */ }
  }, [activeChatId, isClient]);

  // Get active session messages
  const activeSession = sessions.find((s) => s.id === activeChatId);
  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession?.messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Build chat history for sidebar
  const chatHistory: ChatHistoryEntry[] = sessions.map((s) => {
    const lastMsg = s.messages[s.messages.length - 1];
    return {
      id: s.id,
      title:
        s.messages[0]?.content.slice(0, 40) +
        (s.messages[0]?.content.length > 40 ? "…" : "") || "New Chat",
      lastMessage: lastMsg?.content.slice(0, 50) + "…" || "",
      timestamp: s.createdAt,
    };
  });

  // ─── Helper: append a message to a session ───
  const appendMessage = useCallback(
    (chatId: string, message: Message) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === chatId ? { ...s, messages: [...s.messages, message] } : s
        )
      );
    },
    []
  );

  // ─── New Chat ───
  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      messages: [],
      createdAt: formatTime(new Date()),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setInputValue("");
    setIsLoading(false);
  }, []);

  // ─── Send Message ───
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    let currentChatId = activeChatId;

    // If no active chat, create one
    if (!currentChatId) {
      const newSession: ChatSession = {
        id: generateId(),
        messages: [],
        createdAt: formatTime(new Date()),
      };
      setSessions((prev) => [newSession, ...prev]);
      currentChatId = newSession.id;
      setActiveChatId(currentChatId);
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: inputValue.trim(),
      timestamp: formatTime(new Date()),
    };

    const chatIdForResponse = currentChatId;

    // Get current messages for this session to send as history
    const currentSession = sessions.find((s) => s.id === chatIdForResponse);
    const currentMessages = currentSession?.messages ?? [];

    // Build the messages payload for the API
    const apiMessages = [
      ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: userMessage.role, content: userMessage.content },
    ];

    appendMessage(chatIdForResponse, userMessage);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Build an error message to show in the chat
        const errorCode = data.error?.code ?? "UNKNOWN_ERROR";
        const errorMsg = data.error?.message ?? "An unknown error occurred.";

        let userFacingMessage: string;

        switch (errorCode) {
          case "SERVICE_UNAVAILABLE":
            userFacingMessage =
              "⚠️ **Service Not Configured**\n\nThe AI service is not configured yet. Please set your `OPENAI_API_KEY` in the `.env.local` file and restart the dev server.";
            break;
          case "RATE_LIMITED":
            userFacingMessage =
              "⏳ **Rate Limited**\n\nToo many requests. Please wait a moment and try again.";
            break;
          case "LLM_ERROR":
            userFacingMessage =
              `❌ **AI Error**\n\n${errorMsg}`;
            break;
          case "MESSAGE_TOO_LONG":
            userFacingMessage =
              "📏 **Message Too Long**\n\nYour message exceeds the maximum allowed length. Please shorten it and try again.";
            break;
          case "INVALID_REQUEST":
          case "INVALID_MESSAGE_FORMAT":
            userFacingMessage =
              `⚠️ **Invalid Request**\n\n${errorMsg}`;
            break;
          default:
            userFacingMessage =
              `❌ **Error**\n\nSomething went wrong: ${errorMsg}`;
        }

        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: userFacingMessage,
          timestamp: formatTime(new Date()),
        };
        appendMessage(chatIdForResponse, errorMessage);
      } else {
        // Success — append assistant response
        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: data.data.content,
          timestamp: formatTime(new Date()),
        };
        appendMessage(chatIdForResponse, assistantMessage);
      }
    } catch (networkError) {
      // Network-level failure (server down, no internet, etc.)
      console.error("[Chat] Network error:", networkError);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content:
          "🔌 **Connection Error**\n\nUnable to reach the server. Please check your internet connection and try again.",
        timestamp: formatTime(new Date()),
      };
      appendMessage(chatIdForResponse, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, activeChatId, sessions, appendMessage]);
  if (!isClient) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
             <span className="text-xl font-bold text-zinc-900">SA</span>
          </div>
          <span className="text-sm text-zinc-500">Loading Studio Assistant...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-zinc-950">
      {/* Sidebar */}
      <ChatSidebar
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setIsLoading(false);
        }}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
        {/* Top Bar — minimal, only shows on mobile for the menu toggle */}
        <header className="flex items-center gap-3 bg-zinc-950 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12H21" />
              <path d="M3 6H21" />
              <path d="M3 18H21" />
            </svg>
          </button>
          <span className="text-sm font-medium text-zinc-300">Studio Assistant</span>
        </header>

        {/* Messages Area — ChatGPT style: centered, wide, generous scroll area */}
        <div className="flex-1 overflow-y-auto bg-zinc-950">
          {messages.length === 0 && !isLoading ? (
            /* Empty / welcome state — ChatGPT style */
            <div className="flex h-full flex-col items-center justify-center px-4 animate-fade-in">
              <h2 className="mb-8 text-3xl font-semibold tracking-tight text-zinc-100">
                How can I help you today?
              </h2>
              <div className="grid w-full max-w-2xl grid-cols-2 gap-3 md:grid-cols-2">
                {[
                  { icon: "💡", label: "Brainstorm ideas", sub: "for a project or campaign" },
                  { icon: "📝", label: "Plan a project", sub: "with steps and milestones" },
                  { icon: "🎨", label: "Design feedback", sub: "on visuals or UI" },
                  { icon: "🔧", label: "Debug a problem", sub: "in code or logic" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setInputValue(item.label)}
                    className="flex flex-col items-start gap-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[15px] font-medium text-zinc-200">{item.label}</span>
                    <span className="text-[13px] text-zinc-500">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list — centered like ChatGPT */
            <div className="mx-auto flex max-w-3xl flex-col px-4 py-10 md:px-6">
              {messages.map((msg: Message) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
