"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatDonutCard } from "./StatDonutCard";
import { StorageService } from "@/services/storage";
import type { DashboardStats, DashboardInsights } from "@/types/dashboard";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import ReviewHeatmap from "@/components/dashboard/ReviewHeatmap";
import LibraryReviews from "@/components/dashboard/LibraryReviews";
import ReviewForecast from "@/components/dashboard/ReviewForecast";
import WeakSpotsWidget from "@/components/dashboard/WeakSpotsWidget";
import { buildWeeklyData } from "@/lib/dashboard-utils";

function StatsSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#FAFAF8]">
      <div
        className="mx-auto flex w-full max-w-[1200px] flex-col"
        style={{ padding: "28px 48px", gap: 20 }}
      >
        <div className="flex flex-col gap-1">
          <Skeleton className="h-7 w-36 rounded-[6px]" />
          <Skeleton className="h-4 w-48 rounded-[6px]" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-[12px]" />
          ))}
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-[160px] flex-1 rounded-[12px]" />
          <Skeleton className="h-[160px] w-60 shrink-0 rounded-[12px]" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-[12px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StatsView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);

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
    return () => { cancelled = true; };
  }, []);

  if (!stats || !insights) {
    return <StatsSkeleton />;
  }

  const retentionRate =
    stats.totalCards > 0
      ? Math.round((stats.masteredCards / stats.totalCards) * 100)
      : 0;

  const masteredFill =
    stats.totalCards > 0
      ? Math.round((stats.masteredCards / stats.totalCards) * 100)
      : 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#FAFAF8]">
      <div
        className="mx-auto flex w-full max-w-[1200px] flex-col"
        style={{ padding: "28px 48px", gap: 20 }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-[26px] font-semibold text-[#1A1814]">Estatísticas</h1>
          <p className="text-[14px] text-[#6B6560] mt-0.5">Seu progresso de aprendizado</p>
        </motion.div>

        {/* Row 1: 4 compact stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-4 gap-3"
        >
          <StatDonutCard
            label="Cards dominados"
            value={`${stats.masteredCards}/${stats.totalCards}`}
            fill={masteredFill}
          />
          <StatDonutCard
            label="Taxa de retenção"
            value={`${retentionRate}%`}
            fill={retentionRate}
          />
          <div className="flex h-[88px] flex-col justify-center gap-0.5 rounded-[12px] border border-[#E8E5E0] bg-white px-4">
            <p className="text-[11px] text-[#9C9690]">Total de cards</p>
            <p className="text-[26px] font-bold leading-tight tracking-tight text-[#1A1814] tabular-nums">
              {stats.totalCards}
            </p>
          </div>
          <div className="flex h-[88px] flex-col justify-center gap-0.5 rounded-[12px] border border-[#E8E5E0] bg-white px-4">
            <p className="text-[11px] text-[#9C9690]">Revisados hoje</p>
            <p className="text-[26px] font-bold leading-tight tracking-tight text-[#1A1814] tabular-nums">
              {stats.reviewedToday}
            </p>
          </div>
        </motion.div>

        {/* Row 2: Heatmap + weekly chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex w-full gap-4"
        >
          <div className="w-[460px] shrink-0">
            <ReviewHeatmap activityByDay={stats.activityByDay} />
          </div>
          <div className="flex-1">
            <ActivityChartCard
              title="Esta semana"
              totalValue={String(stats.reviewedToday)}
              sublabel={`${insights.reviewedLast7Days} revisões últimos 7 dias`}
              trendPositive={insights.reviewedLast7Days >= insights.reviewedPrev7Days}
              data={buildWeeklyData(stats.activityByDay)}
              dropdownOptions={["Esta semana", "Últimos 7 dias"]}
              className="h-full rounded-[12px] border-[#E8E5E0]"
            />
          </div>
        </motion.div>

        {/* Row 3: Library reviews + Forecast + Weak spots */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="grid grid-cols-3 gap-4"
        >
          <LibraryReviews libraries={insights.dueByLibrary} />
          <ReviewForecast upcoming={insights.upcomingReviews} />
          <div className="flex flex-col">
            <WeakSpotsWidget />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
