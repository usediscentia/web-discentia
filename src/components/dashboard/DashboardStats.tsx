"use client";

import { Flame } from "lucide-react";
import { motion } from "motion/react";
import type {
  DashboardStats as Stats,
  DashboardInsights,
} from "@/types/dashboard";

interface DashboardStatsProps {
  stats: Stats;
  insights: DashboardInsights;
}

function EditorialStatCard({
  value,
  label,
  sublabel,
  valueRowPrefix,
  index,
  highlightSub = false,
}: {
  value: string;
  label: string;
  sublabel?: string;
  valueRowPrefix?: React.ReactNode;
  index: number;
  highlightSub?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.05 + index * 0.04,
      }}
      className="flex flex-1 flex-col gap-2 rounded-[10px] border border-[#E8E5E0] bg-[#F7F5F2] p-4"
    >
      <div className="flex items-center gap-1.5">
        {valueRowPrefix}
        <span className="text-[48px] leading-none font-bold tracking-[-0.02em] text-[#1A1814] tabular-nums">
          {value}
        </span>
      </div>
      <span
        className="text-[10px] font-medium uppercase text-[#9C9690]"
        style={{ letterSpacing: 1 }}
      >
        {label}
      </span>
      {sublabel ? (
        <span
          className="text-[11px]"
          style={{ color: highlightSub ? "#22C55E" : "#9C9690" }}
        >
          {sublabel}
        </span>
      ) : null}
    </motion.div>
  );
}

export default function DashboardStatsRow({
  stats,
  insights,
}: DashboardStatsProps) {
  const retentionRate =
    stats.totalCards > 0
      ? Math.round((stats.masteredCards / stats.totalCards) * 100)
      : 0;

  const weeklyTrend =
    insights.reviewedPrev7Days === 0
      ? insights.reviewedLast7Days > 0
        ? 100
        : 0
      : Math.round(
          ((insights.reviewedLast7Days - insights.reviewedPrev7Days) /
            insights.reviewedPrev7Days) *
            100,
        );
  const weeklyMasteredDelta = insights.reviewedLast7Days - insights.reviewedPrev7Days;

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <EditorialStatCard
        index={0}
        value={String(stats.dueToday)}
        label="Cards to review"
      />
      <EditorialStatCard
        index={1}
        value={String(stats.streak)}
        label="Day streak"
        sublabel={`Best: ${insights.bestStreak} days`}
        valueRowPrefix={<Flame size={16} className="text-[#F59E0B]" />}
      />
      <EditorialStatCard
        index={2}
        value={`${retentionRate}%`}
        label="Retention rate"
        sublabel={`${weeklyTrend >= 0 ? "↑" : "↓"} ${Math.abs(weeklyTrend)}% this week`}
        highlightSub={weeklyTrend >= 0}
      />
      <EditorialStatCard
        index={3}
        value={String(stats.masteredCards)}
        label="Cards mastered"
        sublabel={`${weeklyMasteredDelta >= 0 ? "+" : ""}${weeklyMasteredDelta} this week`}
      />
    </div>
  );
}
