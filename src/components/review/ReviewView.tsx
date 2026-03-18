"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StorageService } from "@/services/storage";
import { sm2 } from "@/lib/sm2";
import type { ReviewRating } from "@/lib/sm2";
import { ReviewComplete } from "./ReviewComplete";
import { ProgressRing } from "./ProgressRing";
import { FlashcardFront } from "./FlashcardFront";
import { AnswerInput } from "./AnswerInput";
import { EvaluatingIndicator } from "./EvaluatingIndicator";
import { VerdictDisplay } from "./VerdictDisplay";
import { RatingButtons } from "./RatingButtons";
import type { SRSCard } from "@/types/srs";
import { useProviderStore } from "@/stores/provider.store";
import { getAIProvider } from "@/services/ai";
import { buildEvaluationPrompt } from "@/services/ai/prompts/review.prompts";
import { Loader2, Brain } from "lucide-react";

type Phase = "input" | "evaluating" | "evaluated";
type AIVerdict = "correct" | "partial" | "incorrect";

interface SessionCard {
  card: SRSCard;
  userAnswer: string;
  verdict: AIVerdict | null;
  explanation: string;
  keyMissing: string | null;
}

const DEFAULT_ACCENT = "#34D399";

// Card enter/exit variants — exit direction depends on rating
const cardVariants = {
  enter: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 28 },
  },
  exit: (rating: ReviewRating | null) => ({
    opacity: 0,
    y: rating === "easy" ? -120 : rating === "hard" ? 30 : -100,
    x: rating === "easy" ? 20 : 0,
    rotate: rating === "easy" ? 3 : 0,
    scale: rating === "hard" ? 0.97 : 0.95,
    transition: { duration: 0.25, ease: "easeOut" as const },
  }),
};

export default function ReviewView() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [sourceContexts, setSourceContexts] = useState<Record<string, string>>({});
  const [accentColors, setAccentColors] = useState<Record<string, string>>({}); // itemId → library color
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("input");
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [complete, setComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastRating, setLastRating] = useState<ReviewRating | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());

  const { getActiveProviderConfig } = useProviderStore();

  useEffect(() => {
    Promise.all([
      StorageService.getDueCards(20),
      StorageService.getDashboardStats(),
    ]).then(([due, stats]) => {
      setCards(due);
      setStreak(stats.streak);
      setLoading(false);

      const itemIds = [
        ...new Set(due.map((c) => c.libraryItemId).filter(Boolean) as string[]),
      ];
      if (itemIds.length === 0) return;

      Promise.all(itemIds.map((id) => StorageService.getLibraryItem(id))).then((items) => {
        const contextMap: Record<string, string> = {};
        const libraryIdToItemIds: Record<string, string[]> = {};

        for (const item of items) {
          if (!item) continue;

          // Build source context for AI evaluation
          if (item.metadata?.chunks && item.metadata.chunks.length > 0) {
            let text = "";
            for (const chunk of item.metadata.chunks) {
              if (text.length + chunk.text.length > 1500) break;
              text += (text ? "\n" : "") + chunk.text;
            }
            contextMap[item.id] = text;
          } else if (item.content) {
            contextMap[item.id] = item.content.slice(0, 1500);
          }

          // Group item IDs by library ID
          if (!libraryIdToItemIds[item.libraryId]) {
            libraryIdToItemIds[item.libraryId] = [];
          }
          libraryIdToItemIds[item.libraryId].push(item.id);
        }

        setSourceContexts(contextMap);

        // Load library colors
        const libraryIds = Object.keys(libraryIdToItemIds);
        Promise.all(libraryIds.map((id) => StorageService.getLibrary(id))).then((libraries) => {
          const colorMap: Record<string, string> = {};
          for (const library of libraries) {
            if (!library) continue;
            for (const itemId of libraryIdToItemIds[library.id] ?? []) {
              colorMap[itemId] = library.color;
            }
          }
          setAccentColors(colorMap);
        });
      });
    });
  }, []);

  const current = cards[index];
  const accentColor = current?.libraryItemId
    ? (accentColors[current.libraryItemId] ?? DEFAULT_ACCENT)
    : DEFAULT_ACCENT;

  // Alternate subtle tilt per card
  const cardRotation = index % 2 === 0 ? 0.7 : -0.7;

  const handleCheck = useCallback(
    async (userAnswer: string) => {
      setPhase("evaluating");

      let verdict: AIVerdict = "partial";
      let explanation = "";
      let keyMissing: string | null = null;

      try {
        const config = getActiveProviderConfig();
        const provider = getAIProvider(config.type);
        if (provider) {
          const sourceCtx = current.libraryItemId
            ? sourceContexts[current.libraryItemId]
            : undefined;

          const prompt = buildEvaluationPrompt({
            front: current.front,
            back: current.back,
            userAnswer,
            sourceContext: sourceCtx,
          });

          const raw = await new Promise<string>((resolve, reject) => {
            provider.sendMessage(
              [{ role: "user", content: prompt }],
              config,
              {
                onToken: () => {},
                onComplete: (fullText) => resolve(fullText),
                onError: (err) => reject(err),
              }
            );
          });

          const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
          const jsonStart = cleaned.indexOf("{");
          const jsonStr = jsonStart >= 0 ? cleaned.slice(jsonStart) : cleaned;
          const json = JSON.parse(jsonStr);
          verdict = json.verdict ?? "partial";
          explanation = json.explanation ?? "";
          keyMissing = json.keyMissing ?? null;
        }
      } catch {
        verdict = userAnswer.length > 10 ? "partial" : "incorrect";
        explanation = "Could not evaluate — check the correct answer.";
      }

      setSessionCards((prev) => [
        ...prev,
        { card: current, userAnswer, verdict, explanation, keyMissing },
      ]);
      setPhase("evaluated");
    },
    [current, getActiveProviderConfig, sourceContexts]
  );

  const handleDontKnow = useCallback(() => {
    setSessionCards((prev) => [
      ...prev,
      { card: current, userAnswer: "", verdict: null, explanation: "", keyMissing: null },
    ]);
    setPhase("evaluated");
  }, [current]);

  const handleRate = useCallback(
    async (rating: ReviewRating) => {
      setLastRating(rating);
      const updated = sm2(current, rating);
      await StorageService.updateSRSCard(current.id, updated);
      await StorageService.logActivityEvent(
        "srs_review",
        `Reviewed card: ${current.front.slice(0, 40)}`,
        { cardId: current.id, rating }
      );

      if (index + 1 >= cards.length) {
        setComplete(true);
      } else {
        setIndex((i) => i + 1);
        setPhase("input");
        setIsInputFocused(false);
      }
    },
    [current, index, cards.length]
  );

  const handleRestart = useCallback(() => {
    setLoading(true);
    setCards([]);
    setIndex(0);
    setPhase("input");
    setSessionCards([]);
    setComplete(false);
    setLastRating(null);
    StorageService.getDueCards(20).then((due) => {
      setCards(due);
      setLoading(false);
    });
  }, []);

  const correctCount = sessionCards.filter((s) => s.verdict === "correct").length;
  const partialCount = sessionCards.filter((s) => s.verdict === "partial").length;
  const incorrectCount = sessionCards.filter(
    (s) => s.verdict === "incorrect" || s.verdict === null
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Brain size={24} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No cards due for review right now.</p>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <ReviewComplete
        total={cards.length}
        correctCount={correctCount}
        partialCount={partialCount}
        incorrectCount={incorrectCount}
        streak={streak}
        sessionDuration={Date.now() - sessionStartTime}
        accentColor={accentColor}
        onRestart={handleRestart}
      />
    );
  }

  const lastSessionCard = sessionCards[sessionCards.length - 1];

  // Verdict shown on the card (glow + shake effect)
  const currentVerdict: AIVerdict | null | undefined =
    phase === "evaluated" ? (lastSessionCard?.verdict ?? null) : undefined;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center gap-6 px-4 py-8">
        {/* Progress ring */}
        <ProgressRing
          current={sessionCards.length}
          total={cards.length}
          accentColor={accentColor}
        />

        {/* Flashcard — always visible, exits with direction based on rating */}
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={lastRating}>
            <motion.div
              key={`card-${index}`}
              custom={lastRating}
              variants={cardVariants}
              initial="enter"
              animate="visible"
              exit="exit"
            >
              <FlashcardFront
                front={current.front}
                accentColor={accentColor}
                isEvaluating={phase === "evaluating"}
                rotation={cardRotation}
                isFocused={isInputFocused}
                verdict={currentVerdict}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Below-card content — swaps by phase */}
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <AnswerInput
                  onSubmit={handleCheck}
                  onSkip={handleDontKnow}
                  onFocusChange={setIsInputFocused}
                />
              </motion.div>
            )}

            {phase === "evaluating" && (
              <motion.div
                key="evaluating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EvaluatingIndicator accentColor={accentColor} />
              </motion.div>
            )}

            {phase === "evaluated" && lastSessionCard && (
              <motion.div
                key={`verdict-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <VerdictDisplay
                  verdict={lastSessionCard.verdict}
                  userAnswer={lastSessionCard.userAnswer}
                  explanation={lastSessionCard.explanation}
                  correctAnswer={lastSessionCard.card.back}
                  keyMissing={lastSessionCard.keyMissing}
                />
                <RatingButtons card={current} onRate={handleRate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
