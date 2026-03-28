"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { StorageService } from "@/services/storage";
import type { DashboardStats, DashboardInsights } from "@/types/dashboard";
import { ActivityChartCard } from "@/components/ui/activity-chart-card";
import ReviewHeatmap from "@/components/dashboard/ReviewHeatmap";
import LibraryReviews from "@/components/dashboard/LibraryReviews";
import ReviewForecast from "@/components/dashboard/ReviewForecast";
import { buildWeeklyData } from "@/lib/dashboard-utils";

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
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAF8]">
        <Loader2 size={18} className="animate-spin text-[#D4D4D4]" />
      </div>
    );
  }

  const retentionRate =
    stats.totalCards > 0
      ? Math.round((stats.masteredCards / stats.totalCards) * 100)
      : 0;

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
        >
          <h1 className="text-[28px] font-semibold text-[#1A1814]">Estatísticas</h1>
          <p className="text-[16px] text-[#6B6560] mt-1">
            Seu progresso de aprendizado
          </p>
        </motion.div>

        {/* Summary row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { label: "Cards dominados", value: stats.masteredCards },
            { label: "Taxa de retenção", value: `${retentionRate}%` },
            { label: "Total de cards", value: stats.totalCards },
            { label: "Revisados hoje", value: stats.reviewedToday },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-[12px] border border-[#E8E5E0] bg-white px-5 py-4"
            >
              <p className="text-[13px] text-[#9C9690]">{label}</p>
              <p className="mt-1 text-[24px] font-semibold text-[#1A1814]">{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Heatmap + weekly chart */}
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

        {/* Library breakdown + forecast */}
        <div className="flex w-full gap-4">
          <LibraryReviews libraries={insights.dueByLibrary} />
          <ReviewForecast upcoming={insights.upcomingReviews} />
        </div>
      </div>
    </div>
  );
}
