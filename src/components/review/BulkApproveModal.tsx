"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { StorageService } from "@/services/storage";
import type { FlashcardData } from "@/types/exercise";

interface BulkApproveModalProps {
  cards: FlashcardData["cards"];
  onDone: () => void;
  onSkip: () => void;
}

export function BulkApproveModal({ cards, onDone, onSkip }: BulkApproveModalProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setDismissed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const kept = cards.filter((c) => !dismissed.has(c.id));

  const handleSave = async () => {
    if (kept.length === 0) { onSkip(); return; }
    setSaving(true);
    try {
      await StorageService.createSRSCards(
        kept.map((c) => ({ front: c.front, back: c.back }))
      );
      await StorageService.logActivityEvent(
        "exercise_completed",
        `Added ${kept.length} cards to SRS deck`,
        { cardCount: kept.length }
      );
      onDone();
    } catch {
      // Storage error — remain open so user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">Save cards to your review deck?</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Remove any cards you don&apos;t want to keep. The rest will be added to your SRS deck.
          </p>
        </div>

        {/* Card list */}
        <div className="divide-y divide-[#F3F4F6] max-h-72 overflow-y-auto">
          {cards.map((card) => {
            const isDismissed = dismissed.has(card.id);
            return (
              <div
                key={card.id}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                  isDismissed ? "bg-red-50/60" : "bg-white"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isDismissed ? "bg-red-400" : "bg-[#1A7A6D]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDismissed ? "text-[#999] line-through" : "text-[#111]"}`}>
                    {card.front}
                  </p>
                  <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{card.back}</p>
                </div>
                <button
                  onClick={() => toggle(card.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    isDismissed
                      ? "bg-red-100 text-red-500 hover:bg-red-200"
                      : "bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB]"
                  }`}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F3F4F6]">
          <span className="text-xs text-[#9CA3AF] flex-1">
            {kept.length} of {cards.length} cards selected
          </span>
          <button
            onClick={onSkip}
            className="px-4 py-2 text-xs font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB] transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1A7A6D] rounded-lg cursor-pointer hover:bg-[#15665B] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : `Add ${kept.length} card${kept.length !== 1 ? "s" : ""} →`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
