"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  FileText,
  Image,
  File,
  Layers,
  Sparkles,
  Settings,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { useDialogStore } from "@/stores/dialog.store";
import { StorageService } from "@/services/storage";
import type { ScoredDeckSource } from "@/services/storage";
import type { Deck, DeckSourceType } from "@/types/deck";

interface NavCommand {
  id: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
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

const ITEM_TYPE_ICONS: Record<DeckSourceType, typeof FileText> = {
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
    openDeck,
  } = useAppStore();
  const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen);

  const [query, setQuery] = useState("");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [sourceResults, setSourceResults] = useState<ScoredDeckSource[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input + load decks when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      const timeout = window.setTimeout(() => {
        setQuery("");
        setActiveIndex(0);
      }, 0);
      setTimeout(() => inputRef.current?.focus(), 50);
      StorageService.listDecks().then(setDecks);
      return () => window.clearTimeout(timeout);
    }
  }, [commandPaletteOpen]);

  // Load recent sources when query is empty
  useEffect(() => {
    if (!commandPaletteOpen) return;
    if (query.trim()) return;

    StorageService.searchDeckSources({ query: "", limit: 5 }).then(
      setSourceResults
    );
  }, [commandPaletteOpen, query]);

  // Debounced source search
  useEffect(() => {
    if (!query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const sources = await StorageService.searchDeckSources({
        query,
        limit: 5,
      });
      if (cancelled) return;
      setSourceResults(sources);
      setActiveIndex(0);
      setLoading(false);
    }, 200);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const deckMap = useMemo(
    () => new Map(decks.map((d) => [d.id, d])),
    [decks]
  );

  const navCommands = useMemo<NavCommand[]>(
    () => [
      {
        id: "nav-decks",
        label: "Ir para Decks",
        icon: Layers,
        run: () => setActiveView("decks"),
      },
      {
        id: "nav-study",
        label: "Ir para Estudar",
        icon: Sparkles,
        run: () => setActiveView("study"),
      },
      {
        id: "nav-settings",
        label: "Abrir Configurações",
        icon: Settings,
        run: () => setSettingsOpen(true),
      },
    ],
    [setActiveView, setSettingsOpen]
  );

  const commandResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navCommands;
    return navCommands.filter((c) => c.label.toLowerCase().includes(q));
  }, [query, navCommands]);

  const deckResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? decks.filter((d) => d.name.toLowerCase().includes(q))
      : decks;
    return list.slice(0, 5);
  }, [query, decks]);

  const allResults = useMemo(
    () => [
      ...commandResults.map((c) => ({ type: "command" as const, data: c })),
      ...deckResults.map((d) => ({ type: "deck" as const, data: d })),
      ...sourceResults.map((r) => ({ type: "source" as const, data: r })),
    ],
    [commandResults, deckResults, sourceResults]
  );

  const openResult = useCallback(
    (result: (typeof allResults)[number]) => {
      if (result.type === "command") {
        result.data.run();
      } else if (result.type === "deck") {
        openDeck(result.data.id);
      } else {
        openDeck(result.data.source.deckId); // TODO(issue-05): focus the source inside the deck
      }
      setCommandPaletteOpen(false);
    },
    [openDeck, setCommandPaletteOpen]
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

              {/* Commands section */}
              {commandResults.length > 0 && (
                <>
                  <p className="text-[12px] font-medium text-[#9CA3AF] px-4 pt-2 pb-1">
                    Comandos
                  </p>
                  {commandResults.map((c, i) => {
                    const Icon = c.icon;
                    const globalIdx = i;
                    return (
                      <button
                        key={c.id}
                        onClick={() => openResult({ type: "command", data: c })}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 h-[40px] px-4 text-left transition-colors cursor-pointer ${
                          activeIndex === globalIdx
                            ? "bg-[#F3F4F6]"
                            : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <Icon size={16} className="text-[#9CA3AF] shrink-0" />
                        <p className="flex-1 min-w-0 text-[14px] text-[#171717] truncate">
                          {highlight(c.label, query)}
                        </p>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Divider */}
              {commandResults.length > 0 && deckResults.length > 0 && (
                <div className="h-px bg-[#E5E7EB] mx-0 my-1" />
              )}

              {/* Decks section */}
              {deckResults.length > 0 && (
                <>
                  <p className="text-[12px] font-medium text-[#9CA3AF] px-4 pt-2 pb-1">
                    Decks
                  </p>
                  {deckResults.map((deck, i) => {
                    const globalIdx = commandResults.length + i;
                    return (
                      <button
                        key={deck.id}
                        onClick={() => openResult({ type: "deck", data: deck })}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 h-[40px] px-4 text-left transition-colors cursor-pointer ${
                          activeIndex === globalIdx
                            ? "bg-[#F3F4F6]"
                            : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: deck.color }}
                        />
                        <p className="flex-1 min-w-0 text-[14px] text-[#171717] truncate">
                          {highlight(deck.name, query)}
                        </p>
                        <span className="text-[11px] text-[#D1D5DB] shrink-0">
                          {deck.cardCount} cards
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Divider */}
              {(commandResults.length > 0 || deckResults.length > 0) &&
                sourceResults.length > 0 && (
                  <div className="h-px bg-[#E5E7EB] mx-0 my-1" />
                )}

              {/* Sources section */}
              {sourceResults.length > 0 && (
                <>
                  <p className="text-[12px] font-medium text-[#9CA3AF] px-4 pt-2 pb-1">
                    {query.trim() ? "Fontes" : "Recentes"}
                  </p>
                  {sourceResults.map((r, i) => {
                    const deck = deckMap.get(r.source.deckId);
                    const Icon = ITEM_TYPE_ICONS[r.source.type] ?? FileText;
                    const globalIdx =
                      commandResults.length + deckResults.length + i;
                    return (
                      <button
                        key={r.source.id}
                        onClick={() => openResult({ type: "source", data: r })}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 h-[44px] px-4 text-left transition-colors cursor-pointer ${
                          activeIndex === globalIdx
                            ? "bg-[#F3F4F6]"
                            : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <Icon size={16} className="text-[#9CA3AF] shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <p className="text-[14px] text-[#171717] truncate leading-tight">
                            {highlight(r.source.title, query)}
                          </p>
                          {deck && (
                            <p className="text-[12px] text-[#9CA3AF] truncate leading-tight">
                              {deck.name}
                            </p>
                          )}
                        </div>
                        {deck && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: deck.color }}
                          />
                        )}
                        <span className="text-[11px] text-[#D1D5DB] shrink-0">
                          {timeAgo(r.source.updatedAt)}
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
