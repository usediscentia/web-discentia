"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGenerationStore } from "@/stores/generation.store";
import FlashcardSlide from "./FlashcardSlide";

interface ReviewStepProps {
  onSave: () => void;
  onRegenerate: () => void;
  onBackToSettings: () => void;
  saving: boolean;
}

export default function ReviewStep({
  onSave,
  onRegenerate,
  onBackToSettings,
  saving,
}: ReviewStepProps) {
  const {
    generatedCards,
    removedCardIds,
    editingCardId,
    setEditingCard,
    updateCard,
    removeCard,
  } = useGenerationStore();

  const prefersReducedMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  const activeCards = useMemo(
    () => generatedCards.filter((c) => !removedCardIds.has(c.id)),
    [generatedCards, removedCardIds]
  );

  // Clamp index when cards are removed
  useEffect(() => {
    if (activeCards.length > 0 && selectedIndex >= activeCards.length) {
      setSelectedIndex(activeCards.length - 1);
    }
  }, [activeCards.length, selectedIndex]);

  const currentCard = activeCards[Math.min(selectedIndex, Math.max(0, activeCards.length - 1))];
  const isEditing = editingCardId !== null;

  const goNext = useCallback(() => {
    if (selectedIndex < activeCards.length - 1) {
      setDirection(1);
      setSelectedIndex((i) => i + 1);
    }
  }, [selectedIndex, activeCards.length]);

  const goPrev = useCallback(() => {
    if (selectedIndex > 0) {
      setDirection(-1);
      setSelectedIndex((i) => i - 1);
    }
  }, [selectedIndex]);

  const handleStartEdit = useCallback(() => {
    if (!currentCard) return;
    setEditFront(currentCard.front);
    setEditBack(currentCard.back);
    setEditingCard(currentCard.id);
  }, [currentCard, setEditingCard]);

  const handleSaveEdit = useCallback(() => {
    if (!editingCardId) return;
    updateCard(editingCardId, editFront, editBack);
  }, [editingCardId, editFront, editBack, updateCard]);

  const handleRemove = useCallback(() => {
    if (!currentCard) return;
    removeCard(currentCard.id);
  }, [currentCard, removeCard]);

  const slideVariants = {
    enter: (d: number) => ({
      x: prefersReducedMotion ? 0 : d * 32,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({
      x: prefersReducedMotion ? 0 : d * -32,
      opacity: 0,
    }),
  };

  if (activeCards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center py-12 text-center"
      >
        <p className="text-sm text-[#7C7974] mb-4">All cards removed</p>
        <Button
          onClick={onRegenerate}
          variant="outline"
          size="sm"
          className="cursor-pointer"
        >
          <Sparkles size={14} className="mr-1.5" />
          Regenerate
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        y: prefersReducedMotion ? 0 : -8,
        transition: { duration: 0.12, ease: [0.55, 0, 1, 0.45] },
      }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col min-w-0"
    >
      {/* Header — title + counter badge, leaves space for Dialog's X button */}
      <div className="flex items-center gap-2.5 mb-5 pr-8">
        <h2 className="text-2xl font-bold leading-none text-[#0C0C0C] tracking-tight">
          Review
        </h2>
        <span className="text-xs font-medium text-[#7C7974] bg-[#F5F2EE] px-2.5 py-1 rounded-full tabular-nums">
          {selectedIndex + 1} of {activeCards.length}
        </span>
      </div>

      {/* Body — AnimatePresence switches card view ↔ edit form */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#A8A5A0] tracking-widest uppercase">
                Front
              </label>
              <textarea
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                rows={3}
                autoFocus
                className="w-full text-sm text-[#0C0C0C] bg-[#F8F8F7] border border-[#E4E3E1] rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-[#A8A5A0] tracking-widest uppercase">
                Back
              </label>
              <textarea
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                rows={4}
                className="w-full text-sm text-[#5C5A56] bg-[#F8F8F7] border border-[#E4E3E1] rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingCard(null)}
                className="px-3.5 py-2 text-xs font-medium text-[#7C7974] hover:text-[#3D3B38] rounded-md border border-[#E4E3E1] hover:bg-[#F8F8F7] active:scale-[0.97] cursor-pointer"
                style={{ transition: "color 150ms ease, background-color 150ms ease, transform 100ms ease" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3.5 py-2 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-80 active:scale-[0.97] cursor-pointer"
                style={{ transition: "opacity 150ms ease, transform 100ms ease" }}
              >
                Save ✓
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4"
          >
            {/* Card with directional slide animation */}
            <div className="overflow-hidden rounded-xl">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentCard?.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                >
                  {currentCard && <FlashcardSlide card={currentCard} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={selectedIndex === 0}
                aria-label="Previous card"
                className="size-8 rounded-full border border-[#E4E3E1] bg-white flex items-center justify-center text-[#7C7974] hover:text-[#3D3B38] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.9] cursor-pointer"
                style={{ transition: "color 150ms ease, transform 100ms ease" }}
              >
                <ChevronLeft size={15} />
              </button>

              {activeCards.length <= 7 ? (
                <div className="flex items-center gap-1.5">
                  {activeCards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > selectedIndex ? 1 : -1);
                        setSelectedIndex(i);
                      }}
                      aria-label={`Go to card ${i + 1}`}
                      className="flex items-center justify-center size-5 cursor-pointer"
                    >
                      <span
                        className={`rounded-full transition-all duration-150 ${
                          i === selectedIndex
                            ? "w-2 h-2 bg-foreground"
                            : "w-1.5 h-1.5 bg-[#D3D1CE] hover:bg-[#A8A5A0]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#A8A5A0] tabular-nums">
                  {selectedIndex + 1} / {activeCards.length}
                </span>
              )}

              <button
                onClick={goNext}
                disabled={selectedIndex === activeCards.length - 1}
                aria-label="Next card"
                className="size-8 rounded-full border border-[#E4E3E1] bg-white flex items-center justify-center text-[#7C7974] hover:text-[#3D3B38] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.9] cursor-pointer"
                style={{ transition: "color 150ms ease, transform 100ms ease" }}
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#7C7974] hover:text-[#3D3B38] hover:bg-[#F8F8F7] active:scale-[0.97] cursor-pointer"
                style={{ transition: "color 150ms ease, background-color 150ms ease, transform 100ms ease" }}
              >
                <Pencil size={12} />
                Edit
              </button>
              <div className="w-px h-4 bg-[#E4E3E1]" />
              <button
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#7C7974] hover:text-red-600 hover:bg-red-50 active:scale-[0.97] cursor-pointer"
                style={{ transition: "color 150ms ease, background-color 150ms ease, transform 100ms ease" }}
              >
                <X size={12} />
                Remove
              </button>
            </div>

            <Separator />

            {/* Primary CTA */}
            <Button
              onClick={onSave}
              disabled={saving}
              className="w-full h-11 rounded-lg bg-gradient-to-b from-[#222018] to-[#171614] hover:brightness-110 active:scale-[0.97] text-white text-sm font-medium cursor-pointer shadow-[0_0_0_0.5px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)]"
              style={{ transition: "filter 150ms ease, transform 150ms ease" }}
            >
              {saving
                ? "Saving..."
                : `Add ${activeCards.length} card${activeCards.length !== 1 ? "s" : ""} to deck`}
            </Button>

            {/* Secondary actions */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onRegenerate}
                className="text-xs text-[#A8A5A0] hover:text-[#5C5A56] transition-colors cursor-pointer"
              >
                Regenerate
              </button>
              <span className="text-xs text-[#D3D1CE]">·</span>
              <button
                onClick={onBackToSettings}
                className="text-xs text-[#A8A5A0] hover:text-[#5C5A56] transition-colors cursor-pointer"
              >
                Back to settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
