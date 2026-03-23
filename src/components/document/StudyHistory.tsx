"use client";

import { useEffect, useState } from "react";
import { GraduationCap, BookOpen, HelpCircle } from "lucide-react";
import { StorageService } from "@/services/storage";
import type { Exercise } from "@/types/exercise";

interface StudyHistoryProps {
  documentId: string;
}

function formatDate(ts: number) {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ExerciseIcon({ type }: { type: Exercise["type"] }) {
  if (type === "flashcard") return <BookOpen size={14} className="text-[#7C7974]" />;
  return <HelpCircle size={14} className="text-[#7C7974]" />;
}

function cardCount(exercise: Exercise): number {
  if (exercise.type === "flashcard") {
    return (exercise.data as { cards: unknown[] }).cards?.length ?? 0;
  }
  if (exercise.type === "quiz") {
    return (exercise.data as { questions: unknown[] }).questions?.length ?? 0;
  }
  return 0;
}

export default function StudyHistory({ documentId }: StudyHistoryProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    StorageService.listExercisesBySourceItem(documentId).then(setExercises);
  }, [documentId]);

  return (
    <div className="rounded-xl border border-[#E4E3E1] bg-white p-6">
      <h3 className="text-sm font-semibold text-[#3D3B38] mb-4">Study History</h3>

      {exercises.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <GraduationCap size={48} className="text-[#D3D1CE] mb-3" />
          <p className="text-sm text-[#7C7974]">No study sessions yet</p>
          <p className="text-xs text-[#A8A5A0] mt-1">
            Generate your first exercises above to start studying.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => {
            const count = cardCount(exercise);
            return (
              <li
                key={exercise.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-[#F8F8F7] border border-[#F1F0EF]"
              >
                <ExerciseIcon type={exercise.type} />
                <span className="flex-1 text-sm text-[#3D3B38] truncate">{exercise.title}</span>
                {count > 0 && (
                  <span className="text-xs text-[#A8A5A0] shrink-0">
                    {count} {exercise.type === "flashcard" ? "cards" : "questions"}
                  </span>
                )}
                <span className="text-xs text-[#A8A5A0] shrink-0">{formatDate(exercise.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
