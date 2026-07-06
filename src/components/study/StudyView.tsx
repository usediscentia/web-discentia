"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useStudyStore } from "@/stores/study.store";
import { useAppStore } from "@/stores/app.store";
import { TodayScreen } from "./TodayScreen";
import { DeckGrid } from "./DeckGrid";
import { DeckDetail } from "./DeckDetail";
import { StudyRail } from "./StudyRail";
import { StudyCard } from "./StudyCard";
import { StudyInput } from "./StudyInput";
import { StudyRating } from "./StudyRating";
import { StudyComplete } from "./StudyComplete";
import { ConfidenceRating } from "./ConfidenceRating";

const DEFAULT_ACCENT = "#34D399";

export default function StudyView() {
  const {
    cards,
    currentIndex,
    phase,
    results,
    lastRating,
    accentColors,
    pendingConfidence,
    setConfidence,
    submitAnswer,
    skipCard,
    rateCard,
    deleteCard,
    initSession,
  } = useStudyStore();

  const deckDetailId = useAppStore((s) => s.deckDetailId);
  const deckDetailCardId = useAppStore((s) => s.deckDetailCardId);
  const setDeckDetail = useAppStore((s) => s.setDeckDetail);
  const clearDeckDetailCard = useAppStore((s) => s.clearDeckDetailCard);

  useEffect(() => {
    const {
      studyFilterItemId,
      studyFilterDeckId,
      studyFilterDeckWeakest,
      setStudyFilterItemId,
      setStudyFilterDeck,
    } = useAppStore.getState();
    const filter = studyFilterDeckId
      ? { deckId: studyFilterDeckId, weakestOnly: studyFilterDeckWeakest }
      : studyFilterItemId
        ? { libraryItemId: studyFilterItemId }
        : undefined;
    setStudyFilterItemId(null);
    setStudyFilterDeck(null);
    initSession(filter);
  }, [initSession]);

  // Palette navigation can land here mid-session — abandon it and return to
  // the today screen so the deck detail (rendered there) shows immediately.
  // Keyed on deckDetailId, not phase: cram started *from* the detail changes
  // the phase but not the deck, and must keep running.
  useEffect(() => {
    if (!deckDetailId) return;
    const { phase } = useStudyStore.getState();
    if (phase === "today" || phase === "loading") return;
    void initSession();
  }, [deckDetailId, initSession]);

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

  // Today screen (landing) — hero on top, deck grid below, one scroll
  if (phase === "today") {
    if (deckDetailId) {
      return (
        <div className="h-full overflow-y-auto">
          <DeckDetail
            deckId={deckDetailId}
            highlightCardId={deckDetailCardId}
            onHighlightConsumed={clearDeckDetailCard}
            onBack={() => {
              setDeckDetail(null);
              // Cards may have been added/edited/deleted — rebuild today's queue
              void initSession();
            }}
          />
        </div>
      );
    }
    return (
      <div className="h-full overflow-y-auto dot-grid">
        {/* Slightly under full height so the deck section peeks above the fold */}
        <div className="h-[calc(100%-96px)] min-h-[420px]">
          <TodayScreen />
        </div>
        <DeckGrid onOpenDeck={setDeckDetail} />
      </div>
    );
  }

  // Session complete
  if (phase === "complete") {
    return (
      <div className="flex h-full">
        <StudyRail />
        <div className="flex-1 dot-grid">
          <StudyComplete />
        </div>
      </div>
    );
  }

  // Active review
  return (
    <div className="flex h-full">
      <StudyRail />
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center gap-6 px-8 py-8 dot-grid">
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
              onDelete={() => deleteCard(current.id)}
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
                <ConfidenceRating value={pendingConfidence} onChange={setConfidence} />
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
