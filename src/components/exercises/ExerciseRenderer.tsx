"use client";

import { useCallback } from "react";
import type { Exercise, ExerciseResult } from "@/types/exercise";
import type { FlashcardData, QuizData } from "@/types/exercise";
import { FlashcardMorph } from "./FlashcardMorph";
import { QuizMorph } from "./QuizMorph";
import { getDB } from "@/services/storage/database";
import { Layers } from "lucide-react";

interface ExerciseRendererProps {
  exercise: Exercise;
}

export function ExerciseRenderer({ exercise }: ExerciseRendererProps) {
  const handleComplete = useCallback(
    async (result: ExerciseResult) => {
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
    [exercise.id]
  );

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
    // Sprint, Connections, FillGap, Crossword, BossFight — coming later
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
}
