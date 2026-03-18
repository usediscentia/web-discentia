"use client";

import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { useGenerationStore } from "@/stores/generation.store";

export default function GeneratingStep() {
  const { generationProgress, currentGeneratingIndex, cardCount } =
    useGenerationStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center py-8"
    >
      {/* Skeleton card */}
      <div className="w-52 h-72 rounded-xl bg-[#F1F0EF] relative overflow-hidden mb-8">
        {/* Shimmer animation */}
        <div className="absolute inset-0 shimmer-sweep" />

        {/* Skeleton lines */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
          <div className="w-full h-3 bg-[#E4E3E1] rounded-full" />
          <div className="w-3/4 h-3 bg-[#E4E3E1] rounded-full" />
          <div className="w-5/6 h-3 bg-[#E4E3E1] rounded-full" />
          <div className="w-2/3 h-3 bg-[#E4E3E1] rounded-full" />
        </div>
      </div>

      {/* Progress text */}
      <p className="text-sm text-[#7C7974] mb-3">
        {generationProgress > 0
          ? `Generating card ${currentGeneratingIndex} of ${cardCount}...`
          : "Preparing flashcards..."}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <Progress
          value={generationProgress}
          className="h-1.5 bg-[#F1F0EF]"
        />
      </div>

      <style jsx>{`
        .shimmer-sweep {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          animation: shimmer 1.8s infinite;
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  );
}
