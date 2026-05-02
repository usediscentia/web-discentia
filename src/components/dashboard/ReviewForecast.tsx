"use client";

import { motion } from "motion/react";
import type { DashboardUpcomingReview } from "@/types/dashboard";

interface ReviewForecastProps {
  upcoming: DashboardUpcomingReview[];
}

const URGENCY: { color: string; muted: string }[] = [
  { color: "#EF4444", muted: "#FEE2E2" },
  { color: "#F97316", muted: "#FFEDD5" },
  { color: "#6366F1", muted: "#EEF2FF" },
  { color: "#8B5CF6", muted: "#EDE9FE" },
  { color: "#94A3B8", muted: "#F1F5F9" },
];

const SHORT_LABEL: Record<string, string> = {
  "In 1 hour": "1h",
  "Later today": "Today",
  "Tomorrow": "Tmrw",
  "This week": "Week",
  "Next week": "Next",
};

const MAX_BAR_HEIGHT = 80;

export default function ReviewForecast({ upcoming }: ReviewForecastProps) {
  const maxCount = Math.max(...upcoming.map((u) => u.dueCount), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-1 flex-col gap-5 rounded-[12px] border border-[#E8E5E0] bg-white p-6"
    >
      <span
        className="text-[13px] font-medium uppercase text-[#9C9690]"
        style={{ letterSpacing: 1 }}
      >
        Upcoming reviews
      </span>

      <div className="flex flex-1 items-end gap-2">
        {upcoming.map((item, index) => {
          const isEmpty = item.dueCount === 0;
          const { color, muted } = URGENCY[index % URGENCY.length];
          const barHeight = isEmpty
            ? 4
            : Math.max(12, (item.dueCount / maxCount) * MAX_BAR_HEIGHT);
          const shortLabel = SHORT_LABEL[item.label] ?? item.label;

          return (
            <div
              key={`${item.label}-${item.timestamp}`}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className="text-[11px] font-semibold tabular-nums leading-none"
                style={{ color: isEmpty ? "transparent" : "#1A1814" }}
              >
                {item.dueCount}
              </span>

              <div
                className="flex w-full items-end"
                style={{ height: MAX_BAR_HEIGHT }}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{
                    duration: 0.5,
                    delay: 0.25 + index * 0.06,
                    ease: "easeOut",
                  }}
                  className="w-full rounded-t-[5px]"
                  style={{ backgroundColor: isEmpty ? muted : color }}
                />
              </div>

              <span
                className="text-[10px] text-center leading-tight"
                style={{ color: isEmpty ? "#C5C0BB" : "#6B6560" }}
              >
                {shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
