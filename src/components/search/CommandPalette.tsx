"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, FileText, MessageSquare, X } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { useChatStore } from "@/stores/chat.store";
import { StorageService } from "@/services/storage";
import type { ScoredLibraryItem } from "@/services/storage";
import type { Conversation } from "@/types/chat";

interface ConversationResult {
  conversation: Conversation;
  messageId: string;
  snippet: string;
}

function highlight(text: string, term: string): React.ReactNode {
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-[#111]">
        {text.slice(idx, idx + term.length)}
      </strong>
      {text.slice(idx + term.length)}
    </>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveView, setEditorItemId } = useAppStore();
  const { setActiveConversationId, setSearchHighlight } = useChatStore();

  const [query, setQuery] = useState("");
  const [libraryResults, setLibraryResults] = useState<ScoredLibraryItem[]>([]);
  const [conversationResults, setConversationResults] = useState<ConversationResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Load recents when query is empty
  useEffect(() => {
    if (!commandPaletteOpen) return;
    if (query.trim()) return;

    StorageService.searchLibraryItems({ query: "", limit: 5 }).then((r) =>
      setLibraryResults(r)
    );
    setConversationResults([]);
  }, [commandPaletteOpen, query]);

  // Debounced search with cancellation guard
  useEffect(() => {
    if (!query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const [lib, convos] = await Promise.all([
        StorageService.searchLibraryItems({ query, limit: 5 }),
        StorageService.searchConversations(query, 5),
      ]);
      if (cancelled) return;
      setLibraryResults(lib);
      setConversationResults(convos);
      setActiveIndex(0);
      setLoading(false);
    }, 200);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const allResults = [
    ...libraryResults.map((r) => ({ type: "library" as const, data: r })),
    ...conversationResults.map((r) => ({ type: "conversation" as const, data: r })),
  ];

  const openResult = useCallback(
    (result: (typeof allResults)[number]) => {
      if (result.type === "library") {
        const item = result.data.item;
        if (item.type === "markdown" || item.type === "text") {
          setEditorItemId(item.id);
          setActiveView("editor");
        } else {
          setActiveView("library");
        }
      } else {
        const { conversation, messageId } = result.data;
        setActiveConversationId(conversation.id);
        if (messageId) {
          setSearchHighlight({ term: query, messageId });
        }
        setActiveView("chat");
      }
      setCommandPaletteOpen(false);
    },
    [query, setActiveView, setEditorItemId, setActiveConversationId, setSearchHighlight, setCommandPaletteOpen]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && allResults[activeIndex]) {
        openResult(allResults[activeIndex]);
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    },
    [allResults, activeIndex, openResult, setCommandPaletteOpen]
  );

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
      <motion.div
        key="palette-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          key="palette-modal"
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-xl bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F3F4F6]">
            <Search size={16} className="text-[#9CA3AF] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search everything…"
              className="flex-1 text-sm text-[#111] placeholder:text-[#D1D5DB] bg-transparent outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="text-[10px] text-[#9CA3AF] border border-[#E5E7EB] rounded px-1.5 py-0.5">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="text-sm text-[#9CA3AF] text-center py-10">Searching…</p>
            )}
            {allResults.length === 0 && !loading && query.trim() && (
              <p className="text-sm text-[#9CA3AF] text-center py-10">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}

            {/* Library section */}
            {libraryResults.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider px-4 pt-3 pb-1.5">
                  {query.trim() ? "Library" : "Recent Notes"}
                </p>
                {libraryResults.map((r, i) => {
                  const globalIdx = i;
                  return (
                    <button
                      key={r.item.id}
                      onClick={() => openResult({ type: "library", data: r })}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                        activeIndex === globalIdx ? "bg-[#F3F4F6]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <FileText size={14} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111] truncate">
                          {highlight(r.item.title, query)}
                        </p>
                        {r.item.preview && (
                          <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                            {highlight(r.item.preview.slice(0, 80), query)}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-[#D1D5DB] shrink-0 mt-0.5">
                        {timeAgo(r.item.updatedAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Conversations section */}
            {conversationResults.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider px-4 pt-3 pb-1.5">
                  Conversations
                </p>
                {conversationResults.map((r, i) => {
                  const globalIdx = libraryResults.length + i;
                  return (
                    <button
                      key={r.conversation.id}
                      onClick={() => openResult({ type: "conversation", data: r })}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                        activeIndex === globalIdx ? "bg-[#F3F4F6]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <MessageSquare size={14} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111] truncate">
                          {highlight(r.conversation.title, query)}
                        </p>
                        {r.snippet && (
                          <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                            {highlight(r.snippet, query)}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-[#D1D5DB] shrink-0 mt-0.5">
                        {timeAgo(r.conversation.updatedAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          {allResults.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#F3F4F6] bg-[#FAFAFA]">
              {[
                { key: "↑↓", label: "navigate" },
                { key: "↵", label: "open" },
                { key: "Esc", label: "close" },
              ].map((h) => (
                <div key={h.key} className="flex items-center gap-1.5">
                  <kbd className="text-[10px] text-[#9CA3AF] border border-[#E5E7EB] rounded px-1.5 py-0.5 bg-white">
                    {h.key}
                  </kbd>
                  <span className="text-[10px] text-[#9CA3AF]">{h.label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
