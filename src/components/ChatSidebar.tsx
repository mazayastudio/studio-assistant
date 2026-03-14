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
  onOpenSettings: () => void;
}

export default function ChatSidebar({
  chatHistory,
  activeChatId,
  onSelectChat,
  onNewChat,
  isOpen,
  onClose,
  onOpenSettings,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — ChatGPT style: dark, narrow, minimal */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-zinc-900 transition-transform duration-300 md:relative md:z-auto md:translate-x-0 ${
          isOpen ? "translate-x-0 animate-sidebar-in" : "-translate-x-full"
        }`}
      >
        {/* New Chat Button — at the top like ChatGPT */}
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5V19" />
              <path d="M5 12H19" />
            </svg>
            New chat
          </button>
          {/* Close on mobile */}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6L18 18" />
            </svg>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[13px] text-zinc-500">No conversations yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {chatHistory.map((entry) => {
                const isActive = entry.id === activeChatId;
                return (
                  <button
                    key={entry.id}
                    onClick={() => { onSelectChat(entry.id); onClose(); }}
                    className={`group flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ${
                      isActive
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <span className="truncate text-[14px] font-medium leading-5">
                      {entry.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-900">
              SA
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-zinc-200">Studio Assistant</span>
              <span className="text-[11px] text-zinc-500">v0.1</span>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
