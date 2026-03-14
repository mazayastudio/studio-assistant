"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ChatMessage, { Message } from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import ChatSidebar, { ChatHistoryEntry } from "@/components/ChatSidebar";

// Simulated assistant responses
const SIMULATED_RESPONSES = [
  "That's a great question! Let me think about that for a moment.\n\nBased on my analysis, I'd suggest starting with the core structure first, then gradually adding more features. This approach gives you a solid foundation to build upon.",
  "I understand what you're looking for. Here's what I recommend:\n\n1. First, outline your main objectives\n2. Break them down into smaller, manageable tasks\n3. Prioritize based on impact and effort\n\nWould you like me to elaborate on any of these steps?",
  "Interesting perspective! I've considered several angles on this:\n\n• The first approach focuses on simplicity and speed\n• The second approach prioritizes scalability\n• The third balances both concerns\n\nEach has its trade-offs. What matters most to you in this context?",
  "Great idea! Let me help you refine that further.\n\nThe key insight here is that consistency matters more than perfection. Start with a minimal viable version and iterate based on feedback. This way, you'll make steady progress without getting stuck on details too early.",
  "I'd be happy to help with that! Here's a structured approach:\n\nPhase 1: Research and discovery\nPhase 2: Planning and design\nPhase 3: Implementation\nPhase 4: Testing and refinement\n\nShall we dive into any specific phase?",
];

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

function getResponseIndex(messageCount: number) {
  return messageCount % SIMULATED_RESPONSES.length;
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

  const handleSend = useCallback(() => {
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

    setSessions((prev) =>
      prev.map((s) =>
        s.id === chatIdForResponse
          ? { ...s, messages: [...s.messages, userMessage] }
          : s
      )
    );

    setInputValue("");
    setIsLoading(true);

    // Simulate assistant response after delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content:
          SIMULATED_RESPONSES[
            getResponseIndex(
              (
                sessions.find((s) => s.id === chatIdForResponse)?.messages
                  .length ?? 0
              ) + 1
            )
          ],
        timestamp: formatTime(new Date()),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === chatIdForResponse
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
      setIsLoading(false);
    }, 1500 + Math.random() * 1000);
  }, [inputValue, isLoading, activeChatId, sessions]);

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
