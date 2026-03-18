"use client";

import { useEffect } from "react";
import { motion, useAnimate } from "motion/react";

type Verdict = "correct" | "partial" | "incorrect" | null;

interface FlashcardFrontProps {
  front: string;
  accentColor: string;
  isEvaluating?: boolean;
  rotation?: number;
  isFocused?: boolean;
  verdict?: Verdict;
}

const VERDICT_BORDER: Record<"correct" | "partial" | "incorrect", string> = {
  correct: "#34D399",
  partial: "#FBBF24",
  incorrect: "#F87171",
};

const VERDICT_GLOW: Record<"correct" | "partial" | "incorrect", string> = {
  correct: "0 0 0 1.5px #34D399, 0 0 24px rgba(52, 211, 153, 0.18)",
  partial: "0 0 0 1.5px #FBBF24, 0 0 24px rgba(251, 191, 36, 0.15)",
  incorrect: "0 0 0 1.5px #F87171, 0 0 24px rgba(248, 113, 113, 0.15)",
};

const BASE_SHADOW =
  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.06), 0 20px 48px -8px rgba(0,0,0,0.04)";

export function FlashcardFront({
  front,
  accentColor,
  isEvaluating = false,
  rotation = 0,
  isFocused = false,
  verdict,
}: FlashcardFrontProps) {
  const [scope, animateShake] = useAnimate();
  const targetRotation = isFocused ? 0 : rotation;
  const hasVerdict = verdict != null && verdict !== undefined;
  const boxShadow = hasVerdict
    ? `${BASE_SHADOW}, ${VERDICT_GLOW[verdict as "correct" | "partial" | "incorrect"]}`
    : BASE_SHADOW;

  // Shake on incorrect verdict
  useEffect(() => {
    if (verdict === "incorrect") {
      animateShake(
        scope.current,
        { x: [0, -5, 5, -3, 3, -1, 1, 0] },
        { duration: 0.4, ease: "easeInOut" }
      );
    }
  }, [verdict]);

  return (
    <motion.div
      ref={scope}
      className="w-full bg-white rounded-2xl overflow-hidden relative"
      style={{ border: "1px solid #E5E7EB" }}
      animate={{
        rotate: targetRotation,
        boxShadow,
        borderColor: hasVerdict
          ? VERDICT_BORDER[verdict as "correct" | "partial" | "incorrect"]
          : "#E5E7EB",
      }}
      transition={{
        rotate: { type: "spring", stiffness: 300, damping: 25 },
        boxShadow: { duration: 0.3 },
        borderColor: { duration: 0.3 },
      }}
    >
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      {/* Content */}
      <div className="px-8 py-10 flex items-center justify-center min-h-[200px]">
        <p className="text-xl font-medium leading-relaxed text-gray-900 text-center">
          {front}
        </p>
      </div>

      {/* Shimmer overlay during evaluation */}
      {isEvaluating && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <motion.div
            className="absolute top-0 bottom-0"
            style={{
              width: "55%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            }}
            animate={{ left: ["-55%", "155%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
}
