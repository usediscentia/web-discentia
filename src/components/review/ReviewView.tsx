"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StorageService } from "@/services/storage";
import { sm2 } from "@/lib/sm2";
import type { ReviewRating } from "@/lib/sm2";
import { ReviewCard } from "./ReviewCard";
import { ReviewEvaluation, type AIVerdict } from "./ReviewEvaluation";
import { ReviewComplete } from "./ReviewComplete";
import type { SRSCard } from "@/types/srs";
import { useProviderStore } from "@/stores/provider.store";
import { getAIProvider } from "@/services/ai";
import { Loader2, Brain } from "lucide-react";

type Phase = "input" | "evaluating" | "evaluated";

interface SessionCard {
  card: SRSCard;
  userAnswer: string;
  verdict: AIVerdict | null;
  explanation: string;
}

export default function ReviewView() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("input");
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [complete, setComplete] = useState(false);
  const [streak, setStreak] = useState(0);

  const { getActiveProviderConfig } = useProviderStore();

  useEffect(() => {
    StorageService.getDueCards(20).then((due) => {
      setCards(due);
      setLoading(false);
    });
    StorageService.getDashboardStats().then((s) => setStreak(s.streak));
  }, []);

  const current = cards[index];

  const handleCheck = useCallback(
    async (userAnswer: string) => {
      setPhase("evaluating");

      let verdict: AIVerdict = "partial";
      let explanation = "";

      try {
        const config = getActiveProviderConfig();
        const provider = getAIProvider(config.type);
        if (provider) {
          const prompt = `You are evaluating a student's flashcard answer.

QUESTION: ${current.front}
CORRECT ANSWER: ${current.back}
STUDENT'S ANSWER: ${userAnswer}

Respond with JSON only (no markdown):
{"verdict":"correct"|"partial"|"incorrect","explanation":"one sentence max 20 words"}

Be lenient with phrasing. Focus on conceptual accuracy.`;

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

          const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
          verdict = json.verdict ?? "partial";
          explanation = json.explanation ?? "";
        }
      } catch {
        // Fallback: compare length heuristic
        verdict = userAnswer.length > 10 ? "partial" : "incorrect";
        explanation = "Could not evaluate — check the correct answer.";
      }

      setSessionCards((prev) => [
        ...prev,
        { card: current, userAnswer, verdict, explanation },
      ]);
      setPhase("evaluated");
    },
    [current, getActiveProviderConfig]
  );

  const handleDontKnow = useCallback(() => {
    setSessionCards((prev) => [
      ...prev,
      { card: current, userAnswer: "", verdict: null, explanation: "" },
    ]);
    setPhase("evaluated");
  }, [current]);

  const handleRate = useCallback(
    async (rating: ReviewRating) => {
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
      }
    },
    [current, index, cards.length]
  );

  const correctCount = sessionCards.filter(
    (s) => s.verdict === "correct" || s.verdict === "partial"
  ).length;

  const handleRestart = useCallback(() => {
    setLoading(true);
    setCards([]);
    setIndex(0);
    setPhase("input");
    setSessionCards([]);
    setComplete(false);
    StorageService.getDueCards(20).then((due) => {
      setCards(due);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-[#9CA3AF]" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E6F5F3] flex items-center justify-center">
          <Brain size={24} className="text-[#1A7A6D]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111]">All caught up!</p>
          <p className="text-xs text-[#9CA3AF] mt-1">No cards due for review right now.</p>
        </div>
      </div>
    );
  }

  if (complete) {
    return <ReviewComplete reviewed={sessionCards.length} correct={correctCount} streak={streak} onRestart={handleRestart} />;
  }

  const pct = Math.round((index / cards.length) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#F3F4F6] shrink-0">
        <div>
          <h1 className="text-base font-semibold text-[#111]">Review Session</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{cards.length - index} cards remaining today</p>
        </div>
        <span className="text-xs font-medium text-[#6B7280]">{index + 1} / {cards.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#F3F4F6] shrink-0">
        <motion.div
          className="h-full bg-[#1A7A6D]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto flex items-start justify-center px-8 py-10">
        <AnimatePresence mode="wait">
          {phase === "input" && (
            <motion.div
              key={`input-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
            >
              <ReviewCard
                card={current}
                index={index}
                total={cards.length}
                onCheck={handleCheck}
                onDontKnow={handleDontKnow}
              />
            </motion.div>
          )}

          {phase === "evaluating" && (
            <motion.div
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 pt-20"
            >
              <Loader2 size={20} className="animate-spin text-[#1A7A6D]" />
              <p className="text-xs text-[#9CA3AF]">Evaluating your answer…</p>
            </motion.div>
          )}

          {phase === "evaluated" && sessionCards.length > 0 && (
            <motion.div
              key={`eval-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
            >
              <ReviewEvaluation
                card={sessionCards[sessionCards.length - 1].card}
                userAnswer={sessionCards[sessionCards.length - 1].userAnswer}
                verdict={sessionCards[sessionCards.length - 1].verdict}
                explanation={sessionCards[sessionCards.length - 1].explanation}
                onRate={handleRate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
