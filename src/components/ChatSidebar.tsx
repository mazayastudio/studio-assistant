"use client";

import React from "react";

export interface ChatHistoryEntry {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface ChatSidebarProps {
  chatHistory: ChatHistoryEntry[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({
  chatHistory,
  activeChatId,
  onSelectChat,
  onNewChat,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col transition-transform duration-300 md:relative md:z-auto md:translate-x-0 ${
          isOpen ? "translate-x-0 animate-sidebar-in" : "-translate-x-full"
        }`}
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: "var(--accent-gradient)" }}
            >
              SA
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Studio Assistant
            </span>
          </div>
          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors md:hidden"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6L18 18" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px dashed var(--border-color)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5V19" />
              <path d="M5 12H19" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "var(--bg-tertiary)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No conversations yet.
                <br />
                Start a new chat!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {chatHistory.map((entry) => {
                const isActive = entry.id === activeChatId;
                return (
                  <button
                    key={entry.id}
                    onClick={() => {
                      onSelectChat(entry.id);
                      onClose();
                    }}
                    className="group flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150"
                    style={{
                      background: isActive ? "var(--bg-tertiary)" : "transparent",
                      border: isActive
                        ? "1px solid var(--border-color)"
                        : "1px solid transparent",
                    }}
                  >
                    <span
                      className="truncate text-sm font-medium"
                      style={{
                        color: isActive
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {entry.title}
                    </span>
                    <span className="truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {entry.lastMessage}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                      {entry.timestamp}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Studio Assistant v0.1
          </p>
        </div>
      </aside>
    </>
  );
}
