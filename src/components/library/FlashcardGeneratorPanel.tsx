"use client";

import { useState } from "react";
import { X, Layers, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CardSelector } from "@/components/ui/card-selector";
import type { LibraryItem } from "@/types/library";
import { useFlashcardGenerator } from "@/hooks/useFlashcardGenerator";
import { StorageService } from "@/services/storage";
import { useProviderStore } from "@/stores/provider.store";
import { PROVIDER_DEFAULTS } from "@/types/ai";

interface FlashcardGeneratorPanelProps {
  item: LibraryItem;
  onClose: () => void;
}

export default function FlashcardGeneratorPanel({
  item,
  onClose,
}: FlashcardGeneratorPanelProps) {
  const [prompt, setPrompt] = useState(
    `Generate flashcards about the key concepts in this document`
  );
  const [count, setCount] = useState<number | null>(10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { cards, setCards, isLoading, streamingText, error, generate, reset } =
    useFlashcardGenerator(item);

  const { selectedProvider, providerConfigs } = useProviderStore();
  const requiresKey = PROVIDER_DEFAULTS[selectedProvider].requiresApiKey;
  const hasKey = Boolean(providerConfigs[selectedProvider]?.apiKey);
  const needsSetup = requiresKey && !hasKey;

  const handleGenerate = () => {
    if (!count) return;
    setSaved(false);
    void generate(prompt, count);
  };

  const handleSave = async () => {
    if (cards.length === 0) return;
    setSaving(true);
    try {
      await StorageService.createSRSCards(
        cards.map((c) => ({ front: c.front, back: c.back, libraryItemId: item.id }))
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    reset();
    setSaved(false);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="fg-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="fg-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-60 w-full max-w-lg bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECECEC] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
              <Layers size={14} className="text-[#555]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#999] leading-none mb-0.5">Generate Flashcards</p>
              <h2 className="text-sm font-semibold text-[#1A1A1A] truncate">{item.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#333] transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* Config section */}
          {!saved && (
            <div className="p-5 border-b border-[#ECECEC]">
              {needsSetup && (
                <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  No API key configured for {PROVIDER_DEFAULTS[selectedProvider].displayName}.
                  Set it up in Settings first.
                </div>
              )}

              <label className="block text-xs font-medium text-[#555] mb-1.5">
                What to focus on
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                disabled={isLoading}
                className="w-full text-sm px-3 py-2 border border-[#E5E7EB] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g. key concepts, definitions, important dates..."
              />

              <div className="mt-4">
                <label className="block text-xs font-medium text-[#555] mb-2.5">
                  How many cards?
                </label>
                <CardSelector
                  selectedAmount={count}
                  onSelect={setCount}
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || needsSetup || !prompt.trim() || !count}
                className="mt-4 w-full cursor-pointer bg-[#6366F1] hover:bg-[#5558D9] text-white"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Layers size={14} className="mr-2" aria-hidden="true" />
                    Generate {count ?? "…"} Flashcards
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Streaming indicator */}
          {isLoading && streamingText && (
            <div className="px-5 py-3 border-b border-[#ECECEC]">
              <p className="text-xs text-[#999] mb-1">Reading AI response…</p>
              <p className="text-xs text-[#555] font-mono line-clamp-2 opacity-60">
                {streamingText.slice(-200)}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-5 py-3 border-b border-[#ECECEC]">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Cards list */}
          {cards.length > 0 && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wide">
                  {cards.length} Cards — review &amp; edit before saving
                </p>
                {!saved && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-[#999] hover:text-[#555] transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {cards.map((card, idx) => (
                <div
                  key={card.id}
                  className="border border-[#E5E7EB] rounded-xl overflow-hidden"
                >
                  <div className="flex items-start gap-2 px-3 py-2.5 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                    <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wide mt-0.5 w-8 shrink-0">
                      Front
                    </span>
                    <textarea
                      value={card.front}
                      onChange={(e) =>
                        setCards((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, front: e.target.value } : c
                          )
                        )
                      }
                      rows={2}
                      disabled={saved}
                      className="flex-1 text-sm text-[#1A1A1A] bg-transparent resize-none focus:outline-none disabled:opacity-70"
                    />
                  </div>
                  <div className="flex items-start gap-2 px-3 py-2.5">
                    <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wide mt-0.5 w-8 shrink-0">
                      Back
                    </span>
                    <textarea
                      value={card.back}
                      onChange={(e) =>
                        setCards((prev) =>
                          prev.map((c, i) =>
                            i === idx ? { ...c, back: e.target.value } : c
                          )
                        )
                      }
                      rows={3}
                      disabled={saved}
                      className="flex-1 text-sm text-[#444] bg-transparent resize-none focus:outline-none disabled:opacity-70"
                    />
                    {!saved && (
                      <button
                        onClick={() =>
                          setCards((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-[#CCC] hover:text-red-400 transition-colors cursor-pointer shrink-0 mt-0.5"
                        title="Remove card"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saved state */}
          {saved && (
            <div className="px-5 py-4 border-t border-[#ECECEC] bg-[#F0FDF4]">
              <div className="flex items-center gap-2 text-green-700">
                <BookOpen size={14} />
                <p className="text-sm font-medium">
                  {cards.length} card{cards.length !== 1 ? "s" : ""} added to your deck!
                </p>
              </div>
              <p className="text-xs text-green-600 mt-0.5 ml-5">
                They&apos;ll appear in Review for spaced repetition.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {cards.length > 0 && !saved && (
          <div className="px-5 py-4 border-t border-[#ECECEC] bg-white shrink-0 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || cards.length === 0}
              className="flex-1 cursor-pointer bg-[#1A1A1A] hover:bg-[#333] text-white text-xs"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <ChevronRight size={13} className="mr-1" />
                  Add {cards.length} card{cards.length !== 1 ? "s" : ""} to deck
                </>
              )}
            </Button>
          </div>
        )}

        {saved && (
          <div className="px-5 py-4 border-t border-[#ECECEC] bg-white shrink-0">
            <Button
              size="sm"
              onClick={onClose}
              className="w-full cursor-pointer text-xs"
            >
              Done
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
}
