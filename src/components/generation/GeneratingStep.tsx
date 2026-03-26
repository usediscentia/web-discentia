"use client";

import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { useGenerationStore } from "@/stores/generation.store";

export default function GeneratingStep() {
  const { generationProgress, currentGeneratingIndex, cardCount } =
    useGenerationStore();

  const isPreparing = generationProgress === 0;
  const displayIndex = Math.max(1, currentGeneratingIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col py-4"
    >
      {/* Label */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-[#A8A5A0] mb-3">
        Generating
      </p>

      {/* Display number */}
      <p className="text-[88px] font-bold leading-none text-[#0C0C0C] tracking-tight">
        {displayIndex}
      </p>

      {/* "of N cards" */}
      <p className="text-[22px] font-light text-[#7C7974] mb-10">
        of {cardCount} cards
      </p>

      {/* Progress bar */}
      <Progress
        value={generationProgress}
        className="h-[2px] bg-[#F1F0EF] mb-3"
      />

      {/* Status */}
      <p className="text-xs text-[#A8A5A0]">
        {isPreparing
          ? "Preparing..."
          : "Analyzing content and building cards..."}
      </p>
    </motion.div>
  );
}
