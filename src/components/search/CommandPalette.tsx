"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  FileText,
  Image,
  File,
  MessageSquare,
  X,
} from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { useChatStore } from "@/stores/chat.store";
import { StorageService } from "@/services/storage";
import type { ScoredLibraryItem } from "@/services/storage";
import type { Conversation } from "@/types/chat";
import type { Library, LibraryItemType } from "@/types/library";

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

const ITEM_TYPE_ICONS: Record<LibraryItemType, typeof FileText> = {
  markdown: FileText,
  text: FileText,
  image: Image,
  pdf: File,
  file: File,
};

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    setEditorItemId,
  } = useAppStore();
  const { setActiveConversationId, setSearchHighlight } = useChatStore();

  const [query, setQuery] = useState("");
  const [libraryResults, setLibraryResults] = useState<ScoredLibraryItem[]>([]);
  const [conversationResults, setConversationResults] = useState<
    ConversationResult[]
  >([]);
  const [libraries, setLibraries] = useState<Map<string, Library>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input + load libraries when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      const timeout = window.setTimeout(() => {
        setQuery("");
        setActiveIndex(0);
      }, 0);
      setTimeout(() => inputRef.current?.focus(), 50);
      StorageService.listLibraries().then((libs) =>
        setLibraries(new Map(libs.map((l) => [l.id, l])))
      );
      return () => window.clearTimeout(timeout);
    }
  }, [commandPaletteOpen]);

  // Load recents when query is empty
  useEffect(() => {
    if (!commandPaletteOpen) return;
    if (query.trim()) return;

    StorageService.searchLibraryItems({ query: "", limit: 5 }).then((r) =>
      setLibraryResults(r)
    );
    const timeout = window.setTimeout(() => setConversationResults([]), 0);
    return () => window.clearTimeout(timeout);
  }, [commandPaletteOpen, query]);

  // Debounced search
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

  const allResults = useMemo(
    () => [
      ...libraryResults.map((r) => ({ type: "library" as const, data: r })),
      ...conversationResults.map((r) => ({
        type: "conversation" as const,
        data: r,
      })),
    ],
    [libraryResults, conversationResults]
  );

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
    [
      query,
      setActiveView,
      setEditorItemId,
      setActiveConversationId,
      setSearchHighlight,
      setCommandPaletteOpen,
    ]
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
          className="fixed inset-0 z-50 flex items-start justify-center px-4 bg-black/40 backdrop-blur-sm"
          style={{ paddingTop: "15vh" }}
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            key="palette-modal"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[640px] bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
            style={{
              boxShadow:
                "0 20px 60px -10px rgba(0,0,0,0.15), 0 4px 20px -4px rgba(0,0,0,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 h-[52px] px-4 border-b border-[#E5E7EB]">
              <Search size={20} className="text-[#9CA3AF] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search everything..."
                className="flex-1 text-[16px] text-[#171717] placeholder:text-[#9CA3AF] bg-transparent outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto py-2">
              {loading && (
                <p className="text-[14px] text-[#9CA3AF] text-center py-10">
                  Searching…
                </p>
              )}
              {allResults.length === 0 && !loading && query.trim() && (
                <p className="text-[14px] text-[#9CA3AF] text-center py-10">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {/* Library section */}
              {libraryResults.length > 0 && (
                <>
                  <p className="text-[12px] font-medium text-[#9CA3AF] px-4 pt-2 pb-1">
                    {query.trim() ? "Library Items" : "Recent"}
                  </p>
                  {libraryResults.map((r, i) => {
                    const lib = libraries.get(r.item.libraryId);
                    const Icon = ITEM_TYPE_ICONS[r.item.type] ?? FileText;
                    const globalIdx = i;
                    return (
                      <button
                        key={r.item.id}
                        onClick={() =>
                          openResult({ type: "library", data: r })
                        }
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 h-[44px] px-4 text-left transition-colors cursor-pointer ${
                          activeIndex === globalIdx
                            ? "bg-[#F3F4F6]"
                            : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <Icon
                          size={16}
                          className="text-[#9CA3AF] shrink-0"
                        />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <p className="text-[14px] text-[#171717] truncate leading-tight">
                            {highlight(r.item.title, query)}
                          </p>
                          {lib && (
                            <p className="text-[12px] text-[#9CA3AF] truncate leading-tight">
                              {lib.name}
                            </p>
                          )}
                        </div>
                        {lib && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: lib.color }}
                          />
                        )}
                        <span className="text-[11px] text-[#D1D5DB] shrink-0">
                          {timeAgo(r.item.updatedAt)}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Divider */}
              {libraryResults.length > 0 &&
                conversationResults.length > 0 && (
                  <div className="h-px bg-[#E5E7EB] mx-0 my-1" />
                )}

              {/* Conversations section */}
              {conversationResults.length > 0 && (
                <>
                  <p className="text-[12px] font-medium text-[#9CA3AF] px-4 pt-2 pb-1">
                    Conversations
                  </p>
                  {conversationResults.map((r, i) => {
                    const globalIdx = libraryResults.length + i;
                    return (
                      <button
                        key={r.conversation.id}
                        onClick={() =>
                          openResult({ type: "conversation", data: r })
                        }
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 h-[40px] px-4 text-left transition-colors cursor-pointer ${
                          activeIndex === globalIdx
                            ? "bg-[#F3F4F6]"
                            : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <MessageSquare
                          size={16}
                          className="text-[#9CA3AF] shrink-0"
                        />
                        <p className="flex-1 min-w-0 text-[14px] text-[#171717] truncate">
                          {highlight(r.conversation.title, query)}
                        </p>
                        <span className="text-[11px] text-[#D1D5DB] shrink-0">
                          {timeAgo(r.conversation.updatedAt)}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            {allResults.length > 0 && (
              <div className="flex items-center justify-between h-[40px] px-4 border-t border-[#E5E7EB]">
                <span className="text-[12px] text-[#9CA3AF]">↵ Open</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#9CA3AF]">
                    Tab switch category
                  </span>
                  <span className="text-[12px] text-[#9CA3AF]">Esc close</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
