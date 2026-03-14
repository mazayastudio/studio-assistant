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

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-dvh w-full overflow-hidden">
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
      <main className="flex flex-1 flex-col overflow-hidden" style={{ background: "var(--bg-primary)" }}>
        {/* Top Bar */}
        <header
          className="flex items-center gap-3 px-4 py-3 md:px-6"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors md:hidden"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            aria-label="Open sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12H21" />
              <path d="M3 6H21" />
              <path d="M3 18H21" />
            </svg>
          </button>

          <div className="flex flex-col">
            <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {activeSession
                ? messages[0]?.content.slice(0, 30) +
                  (messages[0]?.content.length > 30 ? "…" : "")
                : "Studio Assistant"}
            </h1>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {isLoading ? "Typing…" : activeSession ? `${messages.length} messages` : "Start a conversation"}
            </span>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          {messages.length === 0 && !isLoading ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center text-center animate-fade-in">
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--accent-gradient)", boxShadow: "var(--shadow-glow)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                Welcome to Studio Assistant
              </h2>
              <p className="max-w-md text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Your AI-powered creative companion. Ask anything — brainstorm ideas,
                get feedback, or plan your next project.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                  "💡 Brainstorm ideas",
                  "📝 Plan a project",
                  "🎨 Design feedback",
                  "🔧 Debug a problem",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInputValue(suggestion.slice(2).trim());
                    }}
                    className="rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              {messages.map((msg: Message) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
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
