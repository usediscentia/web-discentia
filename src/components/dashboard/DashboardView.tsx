"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { StorageService } from "@/services/storage";
import type { DashboardStats, DashboardInsights } from "@/types/dashboard";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import DashboardStatsRow from "./DashboardStats";
import ReviewHeatmap from "./ReviewHeatmap";
import LibraryReviews from "./LibraryReviews";
import ReviewForecast from "./ReviewForecast";
import { buildWeeklyData } from "@/lib/dashboard-utils";
import { useAppStore } from "@/stores/app.store";

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

function DashboardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#FAFAF8]">
      <div
        className="mx-auto flex w-full max-w-[1200px] flex-col"
        style={{ padding: "32px 48px", gap: 24 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-8 w-48 rounded-[6px]" />
            <Skeleton className="h-5 w-64 rounded-[6px]" />
          </div>
          <Skeleton className="h-4 w-32 rounded-[6px]" />
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-[10px]" />
          ))}
        </div>
        <div className="flex w-full gap-4">
          <Skeleton className="h-[160px] flex-1 rounded-[12px]" />
          <Skeleton className="h-[160px] w-64 shrink-0 rounded-[12px]" />
        </div>
        <div className="flex w-full gap-4">
          <Skeleton className="h-[220px] flex-1 rounded-[12px]" />
          <Skeleton className="h-[220px] flex-1 rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [now] = useState(() => Date.now());
  const { setActiveView } = useAppStore();

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
    return <DashboardSkeleton />;
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
            <div className="flex items-center gap-3">
              <p className="text-[16px] text-[#6B6560]">
                You have {stats.dueToday} card{stats.dueToday !== 1 ? "s" : ""} to review today.
              </p>
              {stats.dueToday > 0 && (
                <button
                  onClick={() => setActiveView("study")}
                  className="text-[13px] font-medium text-white bg-[#1A1814] px-3 py-1 rounded-full cursor-pointer hover:bg-[#2C2A26] transition-colors"
                >
                  Start Review →
                </button>
              )}
            </div>
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
