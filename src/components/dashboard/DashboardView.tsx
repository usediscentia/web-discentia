"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { StorageService } from "@/services/storage";
import type { DashboardStats, DashboardInsights } from "@/types/dashboard";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import DashboardStatsRow from "./DashboardStats";
import ReviewHeatmap from "./ReviewHeatmap";
import LibraryReviews from "./LibraryReviews";
import ReviewForecast from "./ReviewForecast";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildWeeklyData(activityByDay: Record<string, number>) {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    result.push({ day: DAY_LABELS[d.getDay()], value: activityByDay[key] ?? 0 });
  }
  return result;
}

function formatHeaderDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(new Date(ts))
    .toUpperCase();
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      StorageService.getDashboardStats(),
      StorageService.getDashboardInsights(),
    ]).then(([s, i]) => {
      if (!cancelled) {
        setStats(s);
        setInsights(i);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || !insights) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAF8]">
        <Loader2 size={18} className="animate-spin text-[#D4D4D4]" />
      </div>
    );
  }

  const greeting = getGreeting(new Date(now).getHours());

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#FAFAF8]">
      <div
        className="mx-auto flex w-full max-w-[1200px] flex-col"
        style={{ padding: "32px 48px", gap: 24 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex w-full items-center justify-between"
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] font-semibold text-[#1A1814]">
              {greeting}.
            </h1>
            <p className="text-[16px] text-[#6B6560]">
              You have {stats.dueToday} cards to review today.
            </p>
          </div>
          <span
            className="text-[13px] font-medium text-[#9C9690]"
            style={{ letterSpacing: 0.1 }}
          >
            {formatHeaderDate(now)}
          </span>
        </motion.div>

        <DashboardStatsRow stats={stats} insights={insights} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex w-full gap-4"
        >
          <div className="flex-1">
            <ReviewHeatmap activityByDay={stats.activityByDay} />
          </div>
          <div className="w-64 shrink-0">
            <ActivityChartCard
              title="This week"
              totalValue={String(stats.reviewedToday)}
              sublabel={`${insights.reviewedLast7Days} reviews last 7 days`}
              trendPositive={insights.reviewedLast7Days >= insights.reviewedPrev7Days}
              data={buildWeeklyData(stats.activityByDay)}
              dropdownOptions={["This week", "Last 7 days"]}
              className="h-full rounded-[12px] border-[#E8E5E0]"
            />
          </div>
        </motion.div>

        <div className="flex w-full gap-4">
          <LibraryReviews libraries={insights.dueByLibrary} />
          <ReviewForecast upcoming={insights.upcomingReviews} />
        </div>
      </div>
    </div>
  );
}
