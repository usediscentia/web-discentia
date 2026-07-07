"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerationStore } from "@/stores/generation.store";
import type { ExerciseGenerationType } from "@/stores/generation.store";
import { StorageService } from "@/services/storage";
import { buildContextSnippet } from "@/lib/tokens";
import { buildExercisePrompt } from "@/services/ai/prompts/exercise.prompts";
import { parseExerciseFromResponse } from "@/services/ai/parsers/exercise.parser";
import { useProviderStore } from "@/stores/provider.store";
import type { Exercise, FlashcardData } from "@/types/exercise";
import { distributeCards } from "@/lib/distribute-cards";
import { useAppStore } from "@/stores/app.store";
import ConfigureStep from "./ConfigureStep";
import GeneratingStep from "./GeneratingStep";
import ReviewStep from "./ReviewStep";
import ScheduleStep from "./ScheduleStep";
import SuccessStep from "./SuccessStep";
import ErrorStep from "./ErrorStep";

const SUPPORTS_COUNT: Record<ExerciseGenerationType, boolean> = {
  flashcard: true,
  quiz: true,
  sprint: true,
  connections: false,
  fillgap: false,
};

const DEFAULT_PROMPTS: Record<ExerciseGenerationType, string> = {
  flashcard: "Generate flashcards about the main concepts, definitions, and examples taught in this material",
  quiz: "Generate a quiz about the main concepts taught in this material",
  sprint: "Generate a speed quiz about the key facts in this material",
  connections: "Generate a connections puzzle about the key terms in this material",
  fillgap: "Generate a fill-in-the-gap exercise based on important sentences from this material",
};

function getExerciseItemCount(exercise: Exercise | null): number {
  if (!exercise) return 0;
  const data = exercise.data as unknown as Record<string, unknown>;
  if (Array.isArray(data.questions)) return (data.questions as unknown[]).length;
  if (Array.isArray(data.groups)) return (data.groups as unknown[]).length;
  if (Array.isArray(data.gaps)) return (data.gaps as unknown[]).length;
  return 0;
}

export default function GenerationModal() {
  const {
    isOpen,
    step,
    exerciseType,
    cardCount,
    documentId,
    close,
    setStep,
    setError,
    setGeneratedCards,
    setGeneratedExercise,
    setGenerationProgress,
    generatedCards,
    generatedExercise,
    removedCardIds,
    savedCardIds,
    setSavedCardIds,
    errorMessage,
    reset,
  } = useGenerationStore();

  const [saving, setSaving] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const abortGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  const handleGenerate = useCallback(async () => {
    setStep("generating");
    setGenerationProgress(0, 0);

    const { config, provider } = useProviderStore.getState().getConfiguredProvider();
    if (!provider) {
      setError("No AI provider available.");
      return;
    }

    const { exerciseType, focusPrompt, cardCount, documentId } = useGenerationStore.getState();
    const prompt = focusPrompt.trim() || DEFAULT_PROMPTS[exerciseType];

    const item = documentId ? await StorageService.getLibraryItem(documentId) : null;
    const chunks = item?.metadata.chunks ?? [];
    const scoredItem = item
      ? { item, score: 1, matchedChunks: chunks.map((chunk) => ({ chunk, chunkScore: 1 })) }
      : null;
    const { contextText } = buildContextSnippet(scoredItem ? [scoredItem] : [], 4000);

    const fullPrompt = buildExercisePrompt(
      exerciseType,
      prompt,
      contextText || undefined,
      SUPPORTS_COUNT[exerciseType] ? cardCount : undefined
    );

    let fakeProgress = 0;
    clearProgress();
    progressRef.current = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 8, 88);
      setGenerationProgress(fakeProgress, Math.ceil((fakeProgress / 100) * cardCount));
    }, 600);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const sendPromise = provider.sendMessage(
      [{ role: "user", content: fullPrompt }],
      config,
      {
        onToken: () => {},
        onComplete: (fullText: string) => {
          clearProgress();
          if (controller.signal.aborted) return;
          abortControllerRef.current = null;

          const exercise = parseExerciseFromResponse(fullText, "");
          if (exercise && exercise.type === exerciseType) {
            if (exerciseType === "flashcard") {
              const data = exercise.data as FlashcardData;
              setGeneratedCards(data.cards.map((c) => ({ id: c.id, front: c.front, back: c.back })));
            } else {
              setGeneratedExercise({ ...exercise, sourceItemId: documentId ?? undefined });
            }
            setGenerationProgress(100, cardCount);
            setTimeout(() => setStep("review"), 400);
          } else {
            const typeName = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1);
            setError(`Could not parse ${typeName} from the AI response. Try again.`);
          }
        },
        onError: (err: Error) => {
          clearProgress();
          if (controller.signal.aborted) return;
          abortControllerRef.current = null;
          setError(err.message || "Generation failed.");
        },
      },
      controller.signal
    );

    await sendPromise.catch((err: Error) => {
      clearProgress();
      if (controller.signal.aborted || err?.name === "AbortError") return;
      abortControllerRef.current = null;
      setError(err.message ?? "Generation failed.");
    });
  }, [setStep, setError, setGenerationProgress, setGeneratedCards, setGeneratedExercise]);

  const handleSave = useCallback(async () => {
    const { exerciseType, generatedCards, removedCardIds, generatedExercise, documentId } =
      useGenerationStore.getState();

    if (exerciseType === "flashcard") {
      const activeCards = generatedCards.filter((c) => !removedCardIds.has(c.id));
      if (activeCards.length === 0) return;
      setSaving(true);
      try {
        const created = await StorageService.createSRSCards(
          activeCards.map((c) => ({ front: c.front, back: c.back, libraryItemId: documentId ?? "" }))
        );
        setSavedCardIds(created.map((c) => c.id));
        setStep("schedule");
      } finally {
        setSaving(false);
      }
    } else {
      if (!generatedExercise) return;
      setSaving(true);
      try {
        await StorageService.saveExercise(generatedExercise);
        setStep("success");
      } finally {
        setSaving(false);
      }
    }
  }, [setSavedCardIds, setStep]);

  const handleScheduleConfirm = useCallback(async (targetDate: Date) => {
    const timestamps = distributeCards(savedCardIds.length, targetDate);
    await Promise.all(
      savedCardIds.map((id, i) =>
        StorageService.updateSRSCard(id, { nextReviewDate: timestamps[i] })
      )
    );
    setStep("success");
  }, [savedCardIds, setStep]);

  const handleClose = useCallback(() => {
    if (step === "generating") {
      abortGeneration();
      clearProgress();
    }
    if (step === "schedule" && savedCardIds.length > 0) {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 14);
      void handleScheduleConfirm(fallbackDate);
    }
    close();
    if (step !== "generating") setTimeout(reset, 300);
  }, [step, savedCardIds, handleScheduleConfirm, close, reset]);

  const handleAutoClose = useCallback(() => {
    const { exerciseType } = useGenerationStore.getState();
    abortGeneration();
    clearProgress();
    close();
    setTimeout(reset, 300);
    useAppStore.getState().setActiveView(exerciseType === "flashcard" ? "study" : "library");
  }, [close, reset]);

  const successCardCount =
    exerciseType === "flashcard"
      ? generatedCards.filter((c) => !removedCardIds.has(c.id)).length
      : getExerciseItemCount(generatedExercise);

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
          if (!open) handleClose();
        }}
      >
        <DialogContent
          showCloseButton
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:max-w-[440px] rounded-2xl p-6 bg-white border-[#E4E3E1] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12),0_8px_16px_-4px_rgba(0,0,0,0.06)]"
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
                onRegenerate={() => setStep("configure")}
                onBackToSettings={() => setStep("configure")}
              />
            )}
            {step === "schedule" && (
              <ScheduleStep
                key="schedule"
                cardCount={generatedCards.filter((c) => !removedCardIds.has(c.id)).length}
                onConfirm={handleScheduleConfirm}
              />
            )}
            {step === "success" && (
              <SuccessStep
                key="success"
                cardCount={successCardCount}
                subtitle={exerciseType === "flashcard" ? undefined : "exercise saved to your library"}
                badge={exerciseType === "flashcard" ? undefined : "Ready to practice"}
                onAutoClose={handleAutoClose}
              />
            )}
            {step === "error" && (
              <ErrorStep
                key="error"
                message={errorMessage ?? "Something went wrong."}
                onRetry={() => setStep("configure")}
              />
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
