"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { StorageService } from "@/services/storage";
import type { DashboardStats, DashboardInsights } from "@/types/dashboard";
import DashboardStatsRow from "./DashboardStats";
import ReviewHeatmap from "./ReviewHeatmap";
import LibraryReviews from "./LibraryReviews";
import ReviewForecast from "./ReviewForecast";

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
        <ReviewHeatmap activityByDay={stats.activityByDay} />
        <div className="flex w-full gap-4">
          <LibraryReviews libraries={insights.dueByLibrary} />
          <ReviewForecast upcoming={insights.upcomingReviews} />
        </div>
      </div>
    </div>
  );
}
