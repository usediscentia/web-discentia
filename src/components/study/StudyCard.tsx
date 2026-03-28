"use client";

import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import type { SRSCard } from "@/types/srs";
import type { ReviewRating } from "@/lib/sm2";

interface StudyCardProps {
  card: SRSCard;
  index: number;
  total: number;
  showAnswer: boolean;
  verdict: "correct" | "partial" | "incorrect" | null;
  explanation: string;
  keyMissing: string | null;
  accentColor: string;
  lastRating: ReviewRating | null;
}

const cardVariants = {
  enter: { opacity: 0, x: 60, scale: 0.97 },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 28 },
  },
  exit: (rating: string | null) => ({
    opacity: 0,
    x: rating === "easy" ? 30 : rating === "hard" ? -30 : 0,
    scale: 0.95,
    transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] as const },
  }),
};

const verdictGlow: Record<string, string> = {
  correct: "ring-2 ring-emerald-200",
  partial: "ring-2 ring-amber-200",
  incorrect: "ring-2 ring-red-200",
};

export function StudyCard({
  card,
  index,
  total,
  showAnswer,
  verdict,
  explanation,
  keyMissing,
  accentColor,
  lastRating,
}: StudyCardProps) {
  const glowClass = verdict ? (verdictGlow[verdict] ?? "") : "";

  return (
    <AnimatePresence mode="wait" custom={lastRating}>
      <motion.div
        key={`study-card-${card.id}-${index}`}
        custom={lastRating}
        variants={cardVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className={`w-full rounded-2xl border border-gray-200 bg-white overflow-hidden ${glowClass}`}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-0 flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium">
            Card {index + 1} of {total}
          </Badge>
          {card.libraryItemId && (
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          )}
        </div>

        {/* Front — question */}
        <div className="px-6 py-6">
          <p className="text-[17px] font-medium text-gray-900 leading-relaxed">
            {card.front}
          </p>
        </div>

        {/* Answer section */}
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="border-t border-gray-100"
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400">
                  Correct answer
                </span>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{card.back}</p>
              </div>
              {explanation && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400">
                    Feedback
                  </span>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{explanation}</p>
                </div>
              )}
              {keyMissing && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700">{keyMissing}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
