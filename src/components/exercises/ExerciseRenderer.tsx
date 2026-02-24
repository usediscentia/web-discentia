"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { Exercise, ExerciseResult } from "@/types/exercise";
import type { FlashcardData, QuizData, SprintData } from "@/types/exercise";
import { FlashcardMorph } from "./FlashcardMorph";
import { QuizMorph } from "./QuizMorph";
import { SprintMorph } from "./SprintMorph";
import { BulkApproveModal } from "@/components/review/BulkApproveModal";
import { getDB } from "@/services/storage/database";
import { Layers } from "lucide-react";

interface ExerciseRendererProps {
  exercise: Exercise;
}

export function ExerciseRenderer({ exercise }: ExerciseRendererProps) {
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [pendingCards, setPendingCards] = useState<FlashcardData["cards"]>([]);

  const handleComplete = useCallback(
    async (result: ExerciseResult) => {
      if (exercise.type === "flashcard") {
        setPendingCards((exercise.data as FlashcardData).cards);
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
          // Connections, FillGap, Crossword, BossFight — coming later
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
            onDone={() => setShowBulkApprove(false)}
            onSkip={() => setShowBulkApprove(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
