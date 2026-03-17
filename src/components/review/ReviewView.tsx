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
import { buildEvaluationPrompt } from "@/services/ai/prompts/review.prompts";
import { Loader2, Brain, Check, AlertTriangle, X as XIcon } from "lucide-react";

type Phase = "input" | "evaluating" | "evaluated";

interface SessionCard {
  card: SRSCard;
  userAnswer: string;
  verdict: AIVerdict | null;
  explanation: string;
  keyMissing: string | null;
}

export default function ReviewView() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [sourceItemTitles, setSourceItemTitles] = useState<Record<string, string>>({});
  const [sourceContexts, setSourceContexts] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("input");
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [complete, setComplete] = useState(false);
  const [streak, setStreak] = useState(0);

  const { getActiveProviderConfig } = useProviderStore();

  useEffect(() => {
    Promise.all([
      StorageService.getDueCards(20),
      StorageService.getDashboardStats(),
    ]).then(([due, stats]) => {
      setCards(due);
      setStreak(stats.streak);
      setLoading(false);

      // Load source item titles and contexts for cards that have libraryItemId
      const itemIds = [...new Set(due.map((c) => c.libraryItemId).filter(Boolean) as string[])];
      if (itemIds.length === 0) return;
      Promise.all(itemIds.map((id) => StorageService.getLibraryItem(id))).then((items) => {
        const titleMap: Record<string, string> = {};
        const contextMap: Record<string, string> = {};
        for (const item of items) {
          if (!item) continue;
          titleMap[item.id] = item.title;
          // Build source context for evaluation grading
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
        }
        setSourceItemTitles(titleMap);
        setSourceContexts(contextMap);
      });
    });
  }, []);

  const current = cards[index];

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

          // Strip markdown fences and any text before the first {
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
    [current, getActiveProviderConfig]
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

  const correctCount = sessionCards.filter((s) => s.verdict === "correct").length;
  const partialCount = sessionCards.filter((s) => s.verdict === "partial").length;
  const incorrectCount = sessionCards.filter(
    (s) => s.verdict === "incorrect" || s.verdict === null
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
    return <ReviewComplete reviewed={sessionCards.length} correct={correctCount + partialCount} streak={streak} onRestart={handleRestart} />;
  }

  const pct = Math.round((sessionCards.length / cards.length) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#F3F4F6] shrink-0">
        <div>
          <h1 className="text-base font-semibold text-[#111]">Review Session</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{cards.length - index} cards remaining</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Session verdict badges */}
          {correctCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Check size={10} /> {correctCount}
            </span>
          )}
          {partialCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} /> {partialCount}
            </span>
          )}
          {incorrectCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
              <XIcon size={10} /> {incorrectCount}
            </span>
          )}
          <span className="text-xs font-medium text-[#6B7280]">{index + 1} / {cards.length}</span>
        </div>
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
                keyMissing={sessionCards[sessionCards.length - 1].keyMissing}
                sourceItemTitle={
                  sessionCards[sessionCards.length - 1].card.libraryItemId
                    ? sourceItemTitles[sessionCards[sessionCards.length - 1].card.libraryItemId!]
                    : undefined
                }
                onRate={handleRate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
