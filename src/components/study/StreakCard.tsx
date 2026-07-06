"use client";

import { motion, useReducedMotion } from "motion/react";
import { Flame } from "lucide-react";
import { getWeekCompletion } from "@/lib/week-completion";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface StreakCardProps {
  streak: number;
  activityByDay: Record<string, number>;
}

function CheckMark({ animated }: { animated: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden
    >
      {animated ? (
        <motion.path
          d="M20 6 9 17l-5-5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.2, ease: "easeOut", delay: 0.5 }}
        />
      ) : (
        <path d="M20 6 9 17l-5-5" />
      )}
    </svg>
  );
}

export function StreakCard({ streak, activityByDay }: StreakCardProps) {
  const reducedMotion = useReducedMotion();
  const today = new Date();
  const week = getWeekCompletion(activityByDay, today);
  const todayIndex = (today.getDay() + 6) % 7;

  if (streak === 0 && !week.some(Boolean)) return null;

  return (
    <div className="w-full bg-white border border-black/[0.06] rounded-2xl px-5 py-4">
      <div className="flex items-center gap-2 mb-3.5">
        <Flame size={14} className="text-orange-500" />
        <span className="text-sm font-medium text-orange-600 tabular-nums">
          {streak === 1 ? "Streak começou!" : `${streak} dias de streak`}
        </span>
      </div>

      <motion.div
        className="flex justify-between"
        initial={reducedMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
      >
        {week.map((completed, i) => {
          const isFuture = i > todayIndex;
          const popToday = completed && i === todayIndex && !reducedMotion;

          return (
            <motion.div
              key={WEEKDAY_LABELS[i]}
              className="flex flex-col items-center gap-1.5"
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { type: "spring", stiffness: 400, damping: 28 },
                },
              }}
            >
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center ${
                  completed && !popToday
                    ? "bg-orange-500"
                    : isFuture
                      ? "border border-black/[0.05]"
                      : "border border-black/[0.12]"
                }`}
              >
                {completed && !popToday && <CheckMark animated={false} />}
                {popToday && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-orange-500 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                      delay: 0.3,
                    }}
                  >
                    <CheckMark animated />
                  </motion.div>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isFuture ? "text-muted-foreground/50" : "text-muted-foreground"
                }`}
              >
                {WEEKDAY_LABELS[i]}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
