"use client";

import { useEffect } from "react";
import { motion, useAnimate, useMotionValue, useTransform, useReducedMotion, type PanInfo } from "motion/react";

type Verdict = "correct" | "partial" | "incorrect" | null;

interface FlashcardFrontProps {
  front: string;
  accentColor: string;
  /** How many cards are still behind this one (for ghost deck effect) */
  remaining: number;
  isEvaluating?: boolean;
  verdict?: Verdict;
  /** Enable swipe-left-to-skip gesture (only during input phase) */
  isDraggable?: boolean;
  onSwipeLeft?: () => void;
}

const SWIPE_THRESHOLD = 60;

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
  remaining,
  isEvaluating = false,
  verdict,
  isDraggable = false,
  onSwipeLeft,
}: FlashcardFrontProps) {
  const [scope, animateShake] = useAnimate();
  const prefersReducedMotion = useReducedMotion();

  // Motion value to track drag offset for skip hint
  const dragX = useMotionValue(0);
  const skipOpacity = useTransform(dragX, [-120, -SWIPE_THRESHOLD, 0], [1, 0.7, 0]);
  const dragRotate = useTransform(dragX, [-200, 0, 200], [-6, 0, 6]);

  const hasVerdict = verdict != null;
  const boxShadow = hasVerdict
    ? `${BASE_SHADOW}, ${VERDICT_GLOW[verdict as "correct" | "partial" | "incorrect"]}`
    : BASE_SHADOW;

  // Ghost card count (max 2 shown)
  const ghostCount = Math.min(2, remaining);

  // Shake on incorrect verdict
  useEffect(() => {
    if (verdict === "incorrect") {
      animateShake(
        scope.current,
        { x: [0, -5, 5, -3, 3, -1, 1, 0] },
        { duration: 0.4, ease: "easeInOut" }
      );
    }
  }, [animateShake, scope, verdict]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = offset.x * velocity.x;
    if (offset.x < -SWIPE_THRESHOLD || swipe < -600) {
      onSwipeLeft?.();
    }
    dragX.set(0);
  };

  return (
    <div className="relative">
      {/* Ghost cards — deck edge effect showing remaining cards (hidden for reduced motion) */}
      {!prefersReducedMotion && ghostCount >= 2 && (
        <div
          className="absolute inset-0 rounded-2xl border border-gray-100 bg-gray-50"
          style={{ transform: "translateY(14px) rotate(2deg)", zIndex: 1 }}
        />
      )}
      {!prefersReducedMotion && ghostCount >= 1 && (
        <div
          className="absolute inset-0 rounded-2xl border border-gray-200 bg-white"
          style={{ transform: "translateY(7px) rotate(1deg)", zIndex: 2 }}
        />
      )}

      {/* Top card */}
      <motion.div
        ref={scope}
        className="relative bg-white rounded-2xl overflow-hidden"
        style={{
          border: "1px solid #E5E7EB",
          zIndex: 10,
          rotate: isDraggable ? dragRotate : 0,
          x: isDraggable ? dragX : 0,
        }}
        animate={{
          boxShadow,
          borderColor: hasVerdict
            ? VERDICT_BORDER[verdict as "correct" | "partial" | "incorrect"]
            : "#E5E7EB",
        }}
        transition={{
          boxShadow: { duration: 0.3 },
          borderColor: { duration: 0.3 },
        }}
        drag={isDraggable ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.01, cursor: "grabbing" }}
      >
        {/* Accent bar */}
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

        {/* Skip overlay — appears when dragging left */}
        {isDraggable && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none"
            style={{
              background: "rgba(248, 113, 113, 0.08)",
              opacity: skipOpacity,
            }}
          >
            <span className="text-sm font-semibold text-red-400 tracking-wide">Skip ←</span>
          </motion.div>
        )}

        {/* Content */}
        <div className="px-8 py-10 flex items-center justify-center min-h-[200px]">
          <p className="text-xl font-medium leading-relaxed text-gray-900 text-center">
            {front}
          </p>
        </div>

        {/* Swipe hint — only when draggable and no verdict */}
        {isDraggable && !hasVerdict && (
          <div className="absolute bottom-3 inset-x-0 text-center">
            <span className="text-xs text-gray-300 select-none">← swipe to skip</span>
          </div>
        )}

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

      {/* Spacer so ghost cards don't get clipped */}
      {ghostCount > 0 && <div style={{ height: ghostCount * 8 }} />}
    </div>
  );
}
