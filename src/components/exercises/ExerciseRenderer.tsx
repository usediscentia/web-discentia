"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { Exercise, ExerciseResult } from "@/types/exercise";
import type {
  FlashcardData,
  QuizData,
  SprintData,
  ConnectionsData,
  FillGapData,
  BossFightData,
} from "@/types/exercise";
import { FlashcardMorph } from "./FlashcardMorph";
import { QuizMorph } from "./QuizMorph";
import { SprintMorph } from "./SprintMorph";
import { ConnectionsMorph } from "./ConnectionsMorph";
import { FillGapMorph } from "./FillGapMorph";
import { BossFightMorph } from "./BossFightMorph";
import { BulkApproveModal } from "@/components/review/BulkApproveModal";
import { getDB } from "@/services/storage/database";
import { Layers } from "lucide-react";

interface ExerciseRendererProps {
  exercise: Exercise;
}

export function ExerciseRenderer({ exercise }: ExerciseRendererProps) {
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [pendingCards, setPendingCards] = useState<FlashcardData["cards"]>([]);
  const [initialDismissed, setInitialDismissed] = useState<Set<string>>(new Set());

  const handleComplete = useCallback(
    async (result: ExerciseResult) => {
      if (exercise.type === "flashcard") {
        const allCards = (exercise.data as FlashcardData).cards;
        const missedIds = new Set(result.details.missedCardIds ?? []);
        // Pre-dismiss cards the user already knew — only missed ones are kept
        setInitialDismissed(new Set(allCards.filter((c) => !missedIds.has(c.id)).map((c) => c.id)));
        setPendingCards(allCards);
        setShowBulkApprove(true);
      }

      try {
        const db = getDB();
        const current = await db.exercises.get(exercise.id);
        if (current) {
          await db.exercises.update(exercise.id, {
            results: [...current.results, result],
          });
        }
      } catch {
        // Silently fail — result display still works in-memory
      }
    },
    [exercise]
  );

  return (
    <>
      {(() => {
        switch (exercise.type) {
          case "flashcard":
            return (
              <FlashcardMorph
                exerciseId={exercise.id}
                title={exercise.title}
                data={exercise.data as FlashcardData}
                onComplete={handleComplete}
              />
            );
          case "quiz":
            return (
              <QuizMorph
                exerciseId={exercise.id}
                title={exercise.title}
                data={exercise.data as QuizData}
                onComplete={handleComplete}
              />
            );
          case "sprint":
            return (
              <SprintMorph
                exerciseId={exercise.id}
                title={exercise.title}
                data={exercise.data as SprintData}
                onComplete={handleComplete}
              />
            );
          case "connections":
            return (
              <ConnectionsMorph
                exerciseId={exercise.id}
                title={exercise.title}
                data={exercise.data as ConnectionsData}
                onComplete={handleComplete}
              />
            );
          case "fillgap":
            return (
              <FillGapMorph
                exerciseId={exercise.id}
                title={exercise.title}
                data={exercise.data as FillGapData}
                onComplete={handleComplete}
              />
            );
          case "bossfight":
            return (
              <BossFightMorph
                exerciseId={exercise.id}
                title={exercise.title}
                data={exercise.data as BossFightData}
                onComplete={handleComplete}
              />
            );
          // Crossword — deferred due to complexity
          default:
            return (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm text-[#6B7280]">
                <Layers size={16} />
                <span>
                  {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}{" "}
                  exercise generated — interactive view coming soon
                </span>
              </div>
            );
        }
      })()}

      <AnimatePresence>
        {showBulkApprove && pendingCards.length > 0 && (
          <BulkApproveModal
            cards={pendingCards}
            libraryItemId={exercise.sourceItemId}
            initialDismissed={initialDismissed}
            onDone={() => setShowBulkApprove(false)}
            onSkip={() => setShowBulkApprove(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
