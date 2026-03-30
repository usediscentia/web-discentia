"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerationStore } from "@/stores/generation.store";
import { StorageService } from "@/services/storage";
import { buildContextSnippet } from "@/lib/tokens";
import { buildFlashcardPrompt } from "@/services/ai/prompts/exercise.prompts";
import { parseExerciseFromResponse } from "@/services/ai/parsers/exercise.parser";
import { getAIProvider } from "@/services/ai";
import { useProviderStore } from "@/stores/provider.store";
import type { FlashcardData } from "@/types/exercise";
import type { LibraryItem } from "@/types/library";
import { distributeCards } from "@/lib/distribute-cards";
import { useAppStore } from "@/stores/app.store";
import ConfigureStep from "./ConfigureStep";
import GeneratingStep from "./GeneratingStep";
import ReviewStep from "./ReviewStep";
import ScheduleStep from "./ScheduleStep";
import SuccessStep from "./SuccessStep";

interface GenerationModalProps {
  item: LibraryItem;
}

export default function GenerationModal({ item }: GenerationModalProps) {
  const {
    isOpen,
    step,
    cardCount,
    focusPrompt,
    close,
    setStep,
    setGeneratedCards,
    setGenerationProgress,
    generatedCards,
    removedCardIds,
    savedCardIds,
    setSavedCardIds,
    reset,
  } = useGenerationStore();

  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const handleGenerate = useCallback(async () => {
    setStep("generating");
    setGenerationProgress(0, 0);
    setGenError(null);

    const config = useProviderStore.getState().getActiveProviderConfig();
    const provider = getAIProvider(config.type);

    if (!provider) {
      setGenError("No AI provider available.");
      setStep("configure");
      return;
    }

    const prompt =
      focusPrompt.trim() ||
      "Generate flashcards about the key concepts in this document";

    // Build context from item chunks
    const chunks = item.metadata.chunks ?? [];
    const scoredItem = {
      item,
      score: 1,
      matchedChunks: chunks.map((chunk) => ({ chunk, chunkScore: 1 })),
    };
    const { contextText } = buildContextSnippet([scoredItem], 4000);
    const fullPrompt = buildFlashcardPrompt(prompt, contextText || undefined, cardCount);

    // Simulate incremental progress while streaming
    let fakeProgress = 0;
    clearProgress();
    progressRef.current = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 8, 88);
      setGenerationProgress(
        fakeProgress,
        Math.ceil((fakeProgress / 100) * cardCount)
      );
    }, 600);

    // Follow the exact same pattern as useFlashcardGenerator but push to Zustand store
    const sendPromise = provider.sendMessage(
      [{ role: "user", content: fullPrompt }],
      config,
      {
        onToken: () => {
          // streaming — progress bar handles visual feedback
        },
        onComplete: (fullText: string) => {
          clearProgress();

          const exercise = parseExerciseFromResponse(fullText, "");
          if (exercise && exercise.type === "flashcard") {
            const data = exercise.data as FlashcardData;
            const cards = data.cards.map((c) => ({
              id: c.id,
              front: c.front,
              back: c.back,
            }));
            setGeneratedCards(cards);
            setGenerationProgress(100, cardCount);
            setTimeout(() => setStep("review"), 400);
          } else {
            setGenError("Could not parse flashcards from AI response. Try again.");
            setStep("configure");
          }
        },
        onError: (err: Error) => {
          clearProgress();
          setGenError(err.message);
          setStep("configure");
        },
      }
    );

    await sendPromise.catch((err: Error) => {
      clearProgress();
      if (err?.name !== "AbortError") {
        setGenError(err.message ?? "Generation failed.");
        setStep("configure");
      }
    });
  }, [focusPrompt, cardCount, item, setStep, setGenerationProgress, setGeneratedCards]);

  const handleSave = useCallback(async () => {
    const activeCards = generatedCards.filter(
      (c) => !removedCardIds.has(c.id)
    );
    if (activeCards.length === 0) return;
    setSaving(true);
    try {
      const created = await StorageService.createSRSCards(
        activeCards.map((c) => ({
          front: c.front,
          back: c.back,
          libraryItemId: item.id,
        }))
      );
      setSavedCardIds(created.map((c) => c.id));
      setStep("schedule");
    } finally {
      setSaving(false);
    }
  }, [generatedCards, removedCardIds, item.id, setStep, setSavedCardIds]);

  const handleScheduleConfirm = useCallback(async (targetDate: Date) => {
    const timestamps = distributeCards(savedCardIds.length, targetDate);
    await Promise.all(
      savedCardIds.map((id, i) =>
        StorageService.updateSRSCard(id, { nextReviewDate: timestamps[i] })
      )
    );
    setStep("success");
  }, [savedCardIds, setStep]);

  const handleAutoClose = useCallback(() => {
    close();
    setTimeout(reset, 300);
    useAppStore.getState().setActiveView("study");
  }, [close, reset]);

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="generation-backdrop"
          className="fixed inset-0 z-[49] bg-black/50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>
    <Dialog
      modal={false}
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // If closing during schedule step, apply 2-week fallback
          if (step === "schedule" && savedCardIds.length > 0) {
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() + 14);
            void handleScheduleConfirm(fallbackDate);
          }
          close();
          if (step !== "generating") {
            setTimeout(reset, 300);
          }
        }
      }}
    >
      <DialogContent
        showCloseButton
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-2xl rounded-2xl p-6 bg-white border-[#E4E3E1] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12),0_8px_16px_-4px_rgba(0,0,0,0.06)]"
      >
        <DialogTitle className="sr-only">Generate Exercises</DialogTitle>
        <AnimatePresence mode="wait">
          {step === "configure" && (
            <ConfigureStep key="configure" onGenerate={handleGenerate} />
          )}
          {step === "generating" && <GeneratingStep key="generating" />}
          {step === "review" && (
            <ReviewStep
              key="review"
              saving={saving}
              onSave={handleSave}
              onRegenerate={() => {
                setStep("configure");
                setGenError(null);
              }}
              onBackToSettings={() => {
                setStep("configure");
                setGenError(null);
              }}
            />
          )}
          {step === "schedule" && (
            <ScheduleStep
              key="schedule"
              cardCount={
                generatedCards.filter((c) => !removedCardIds.has(c.id)).length
              }
              onConfirm={handleScheduleConfirm}
            />
          )}
          {step === "success" && (
            <SuccessStep
              key="success"
              cardCount={
                generatedCards.filter((c) => !removedCardIds.has(c.id)).length
              }
              onAutoClose={handleAutoClose}
            />
          )}
        </AnimatePresence>

        {genError && step === "configure" && (
          <p className="text-xs text-red-600 mt-2">{genError}</p>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
