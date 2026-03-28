"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Brain } from "lucide-react";
import { useStudyStore } from "@/stores/study.store";
import { StudyRail } from "./StudyRail";
import { StudyCard } from "./StudyCard";
import { StudyInput } from "./StudyInput";
import { StudyRating } from "./StudyRating";
import { StudyComplete } from "./StudyComplete";

const DEFAULT_ACCENT = "#34D399";

export default function StudyView() {
  const {
    cards,
    currentIndex,
    phase,
    results,
    lastRating,
    accentColors,
    submitAnswer,
    skipCard,
    rateCard,
    initSession,
  } = useStudyStore();

  useEffect(() => {
    initSession();
  }, [initSession]);

  const current = cards[currentIndex];
  const accentColor = current?.libraryItemId
    ? (accentColors[current.libraryItemId] ?? DEFAULT_ACCENT)
    : DEFAULT_ACCENT;

  const lastResult = results[results.length - 1];

  // Loading state
  if (phase === "loading") {
    return (
      <div className="flex h-full">
        <StudyRail />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      </div>
    );
  }

  // No cards due (complete with no cards loaded)
  if (cards.length === 0) {
    return (
      <div className="flex h-full">
        <StudyRail />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Brain size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No cards due for review right now.</p>
          </div>
        </div>
      </div>
    );
  }

  // Session complete
  if (phase === "complete") {
    return (
      <div className="flex h-full">
        <StudyRail />
        <div className="flex-1">
          <StudyComplete />
        </div>
      </div>
    );
  }

  // Active review
  return (
    <div className="flex h-full bg-[#FAFAFA]">
      <StudyRail />
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center gap-6 px-8 py-8">
        {/* Card */}
        {current && (
          <div className="w-full max-w-xl">
            <StudyCard
              card={current}
              index={currentIndex}
              total={cards.length}
              showAnswer={phase === "evaluated"}
              verdict={phase === "evaluated" ? (lastResult?.verdict ?? null) : null}
              explanation={phase === "evaluated" ? (lastResult?.explanation ?? "") : ""}
              keyMissing={phase === "evaluated" ? (lastResult?.keyMissing ?? null) : null}
              accentColor={accentColor}
              lastRating={lastRating}
            />
          </div>
        )}

        {/* Below card — input or rating */}
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {phase === "answering" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <StudyInput onSubmit={submitAnswer} onSkip={skipCard} />
              </motion.div>
            )}

            {phase === "evaluating" && (
              <motion.div
                key="evaluating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-8"
              >
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  Evaluating...
                </div>
              </motion.div>
            )}

            {phase === "evaluated" && current && (
              <motion.div
                key={`rating-${currentIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <StudyRating card={current} onRate={rateCard} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
