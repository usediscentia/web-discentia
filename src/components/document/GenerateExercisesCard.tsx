"use client";

import { Sparkles, Layers, BrainCircuit, Zap, Link2 } from "lucide-react";
import { useGenerationStore } from "@/stores/generation.store";
import ExerciseTile from "./ExerciseTile";

interface GenerateExercisesCardProps {
  documentId: string;
  documentTitle: string;
}

export default function GenerateExercisesCard({
  documentId,
  documentTitle,
}: GenerateExercisesCardProps) {
  const open = useGenerationStore((s) => s.open);

  return (
    <div className="rounded-xl border border-[#E4E3E1] bg-white shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <Sparkles size={18} className="text-[#3D3B38]" />
        <h2 className="text-xl font-semibold tracking-tight text-[#0C0C0C]">
          Generate Exercises
        </h2>
      </div>
      <p className="text-sm text-[#7C7974] mb-5">
        Transform this document into interactive study material.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <ExerciseTile
          icon={<Layers size={22} />}
          label="Flashcards"
          onClick={() => open(documentId, documentTitle, "flashcards")}
        />
        <ExerciseTile
          icon={<BrainCircuit size={22} />}
          label="Quiz"
          disabled
          onClick={() => open(documentId, documentTitle, "quiz")}
        />
        <ExerciseTile
          icon={<Zap size={22} />}
          label="Sprint"
          disabled
          onClick={() => open(documentId, documentTitle, "sprint")}
        />
        <ExerciseTile
          icon={<Link2 size={22} />}
          label="Connections"
          disabled
          onClick={() => open(documentId, documentTitle, "connections")}
        />
      </div>
    </div>
  );
}
