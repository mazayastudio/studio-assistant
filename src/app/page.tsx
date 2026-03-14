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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Settings state
  const [temperature, setTemperature] = useState<number>(() => loadFromSession("studio-assistant-temp", 0.7));
  const [maxTokens, setMaxTokens] = useState<number>(() => loadFromSession("studio-assistant-tokens", 1024));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ─── Persist to sessionStorage on changes ───
  useEffect(() => {
    if (!isClient) return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
      sessionStorage.setItem("studio-assistant-temp", JSON.stringify(temperature));
      sessionStorage.setItem("studio-assistant-tokens", JSON.stringify(maxTokens));
    } catch { /* storage full — silently ignore */ }
  }, [sessions, temperature, maxTokens, isClient]);

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

  // ─── Helper: append or update a message in a session ───
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

  const updateMessageContent = useCallback(
    (chatId: string, messageId: string, chunk: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === chatId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === messageId ? { ...m, content: m.content + chunk } : m
                ),
              }
            : s
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

  // ─── Export Chat ───
  const handleExport = useCallback(() => {
    if (!activeSession || activeSession.messages.length === 0) return;
    
    // Build markdown content
    let md = `# Studio Assistant Chat Export\nDate: ${new Date().toLocaleString()}\n\n---\n\n`;
    activeSession.messages.forEach(m => {
      const roleName = m.role === "user" ? "You" : "Studio Assistant";
      md += `**${roleName}** (${m.timestamp}):\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studio-chat-${activeSession.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeSession]);

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
        body: JSON.stringify({ messages: apiMessages, temperature, maxTokens }),
      });

      if (!response.ok) {
        // Handle non-streaming error response
        const data = await response.json();
        const errorCode = data.error?.code ?? "UNKNOWN_ERROR";
        const errorMsg = data.error?.message ?? "An unknown error occurred.";

        let userFacingMessage: string;
        switch (errorCode) {
          case "SERVICE_UNAVAILABLE":
            userFacingMessage = "⚠️ **Service Not Configured**\n\nThe AI service is not configured yet. Please set your `OPENAI_API_KEY` in the `.env.local` file and restart the dev server.";
            break;
          case "RATE_LIMITED":
            userFacingMessage = "⏳ **Rate Limited**\n\nToo many requests. Please wait a moment and try again.";
            break;
          case "LLM_ERROR":
            userFacingMessage = `❌ **AI Error**\n\n${errorMsg}`;
            break;
          case "MESSAGE_TOO_LONG":
            userFacingMessage = "📏 **Message Too Long**\n\nYour message exceeds the maximum allowed length. Please shorten it and try again.";
            break;
          case "INVALID_REQUEST":
          case "INVALID_MESSAGE_FORMAT":
            userFacingMessage = `⚠️ **Invalid Request**\n\n${errorMsg}`;
            break;
          default:
            userFacingMessage = `❌ **Error**\n\nSomething went wrong: ${errorMsg}`;
        }
        appendMessage(chatIdForResponse, {
          id: generateId(),
          role: "assistant",
          content: userFacingMessage,
          timestamp: formatTime(new Date()),
        });
        setIsLoading(false);
        return;
      }

      // Hide typing indicator once stream starts
      setIsLoading(false);

      // Create an empty assistant message to stream into
      const assistantMessageId = generateId();
      appendMessage(chatIdForResponse, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: formatTime(new Date()),
      });

      // Stream parsing
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            updateMessageContent(chatIdForResponse, assistantMessageId, chunk);
          }
        }
      }

    } catch (networkError) {
      // Network-level failure (server down, no internet, etc.)
      console.error("[Chat] Network error:", networkError);
      setIsLoading(false);
      appendMessage(chatIdForResponse, {
        id: generateId(),
        role: "assistant",
        content: "🔌 **Connection Error**\n\nUnable to reach the server. Please check your internet connection and try again.",
        timestamp: formatTime(new Date()),
      });
    }
  }, [inputValue, isLoading, activeChatId, sessions, appendMessage, updateMessageContent, temperature, maxTokens]);
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
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Settings Modal overlay */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">Model Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors"
                aria-label="Close settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6L18 18" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-6">
              {/* Temperature */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300">Temperature</label>
                  <span className="text-xs text-zinc-500">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-zinc-500"
                />
                <p className="text-[12px] text-zinc-500 leading-tight">
                  Higher values make output more random, lower values make it more focused and deterministic.
                </p>
              </div>

              {/* Max Tokens */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300">Max Tokens</label>
                  <span className="text-xs text-zinc-500">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="4096"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-zinc-500"
                />
                <p className="text-[12px] text-zinc-500 leading-tight">
                  The maximum number of tokens to generate in the completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
        {/* Top Bar — minimal, only shows on mobile for the menu toggle, EXCEPT for Export button which shows globally if chat is active */}
        <header className="flex items-center justify-between bg-zinc-950 px-4 py-3 md:bg-transparent md:absolute md:top-0 md:right-0 md:w-auto md:z-10">
          <div className="flex items-center gap-3 md:hidden">
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
          </div>

          {/* Export Button */}
          {activeSession && activeSession.messages.length > 0 && (
            <button
              onClick={handleExport}
              className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              title="Export Chat to Markdown"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden md:inline">Export</span>
            </button>
          )}
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
