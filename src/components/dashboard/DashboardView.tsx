"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CircleCheck,
  Download,
  Flame,
  Loader2,
  Plus,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { DashboardInsights, DashboardStats } from "@/types/dashboard";

const REVIEW_DOT_COLORS = ["#34D399", "#F87171", "#38BDF8"] as const;

function formatHeaderDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

function formatRelativeTime(ts: number, nowTs: number): string {
  const diff = nowTs - ts;
  if (diff < 3600000) {
    const mins = Math.max(1, Math.floor(diff / 60000));
    return `${mins}m ago`;
  }
  if (diff < 86400000) {
    const hours = Math.max(1, Math.floor(diff / 3600000));
    return `${hours}h ago`;
  }
  if (diff < 172800000) return "yesterday";
  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}

function trendFromWeeks(insights: DashboardInsights): {
  colorClass: string;
  label: string;
} {
  const prev = insights.reviewedPrev7Days;
  const raw =
    prev === 0
      ? insights.reviewedLast7Days > 0
        ? 100
        : 0
      : Math.round(
          ((insights.reviewedLast7Days - prev) / Math.max(prev, 1)) * 100
        );
  const value = Math.max(-99, Math.min(99, raw));
  const positive = value >= 0;
  return {
    colorClass: positive ? "text-[#22C55E]" : "text-[#F87171]",
    label: `${positive ? "▲" : "▼"} ${Math.abs(value)}% this week`,
  };
}

export default function DashboardView() {
  const { setActiveView } = useAppStore();
  const [nowTs] = useState(() => Date.now());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      StorageService.getDashboardStats(),
      StorageService.getDashboardInsights(),
    ]).then(([nextStats, nextInsights]) => {
      if (cancelled) return;
      setStats(nextStats);
      setInsights(nextInsights);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const quickActions = useMemo(
    () => [
      {
        label: "Import Content",
        icon: Download,
        onClick: () => setActiveView("library"),
      },
      {
        label: "Add Cards",
        icon: Plus,
        onClick: () => setActiveView("library"),
      },
      {
        label: "Train",
        icon: Zap,
        onClick: () => setActiveView("review"),
      },
      {
        label: "Ask AI",
        icon: Bot,
        onClick: () => setActiveView("chat"),
      },
    ],
    [setActiveView]
  );

  if (!stats || !insights) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAFA]">
        <Loader2 size={20} className="animate-spin text-[#9CA3AF]" />
      </div>
    );
  }

  const retentionRate =
    stats.totalCards > 0
      ? Math.round((stats.masteredCards / stats.totalCards) * 100)
      : 0;
  const retentionTrend = trendFromWeeks(insights);

  const reviewCards =
    insights.dueByLibrary.length > 0
      ? insights.dueByLibrary
      : [
          { libraryId: null, name: "Biology", dueCount: 0 },
          { libraryId: null, name: "History", dueCount: 0 },
          { libraryId: null, name: "React", dueCount: 0 },
        ];

  const reviewCardsWithFallback = [
    ...reviewCards,
    ...[
      { libraryId: null, name: "History", dueCount: 0 },
      { libraryId: null, name: "React", dueCount: 0 },
    ],
  ].slice(0, 3);

  const bestStreak = Math.max(stats.streak, insights.bestStreak);
  const recentActivity =
    insights.recentActivity.length > 0
      ? insights.recentActivity
      : [
          {
            id: "fallback-1",
            type: "srs_review" as const,
            description: "Completed Sprint: Biology (9/10)",
            timestamp: nowTs - 2 * 3600000,
          },
          {
            id: "fallback-2",
            type: "library_item_added" as const,
            description: "Added 5 cards to React library",
            timestamp: nowTs - 5 * 3600000,
          },
          {
            id: "fallback-3",
            type: "exercise_completed" as const,
            description: "Boss Fight: History (defeated!)",
            timestamp: nowTs - 86400000,
          },
          {
            id: "fallback-4",
            type: "exercise_completed" as const,
            description: "Quiz: Civil Law (85%)",
            timestamp: nowTs - 86400000,
          },
        ];

  return (
    <div className="h-full overflow-auto bg-[#FAFAFA]">
      <div className="mx-auto flex w-full max-w-[1184px] flex-col gap-6 px-6 py-8 md:px-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#171717]">Dashboard</h1>
          <p className="text-sm text-[#9CA3AF]">{formatHeaderDate(nowTs)}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#171717] px-6 py-5">
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-medium text-white">
              👋 Good morning! You have {stats.dueToday} cards to review today.
            </p>
            <p className="text-[13px] text-[#9CA3AF]">Let&apos;s keep your streak going.</p>
          </div>
          <Button
            variant="secondary"
            className="h-9 rounded-md bg-white px-4 text-xs font-medium text-[#171717] hover:bg-[#F5F5F5]"
            onClick={() => setActiveView("review")}
            disabled={stats.dueToday === 0}
          >
            Start Review →
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-[13px] font-medium text-[#9CA3AF]">Retention Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-[32px] font-semibold leading-none text-[#171717]">{retentionRate}%</p>
              <p className={`pb-1 text-xs font-medium ${retentionTrend.colorClass}`}>
                {retentionTrend.label}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-[13px] font-medium text-[#9CA3AF]">Mastered Cards</p>
            <div className="flex items-end gap-2">
              <p className="text-[32px] font-semibold leading-none text-[#171717]">
                {stats.masteredCards}
              </p>
              <p className="pb-1 text-xs font-medium text-[#6B7280]">
                +{insights.reviewedThisMonth} reviews this month
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-[13px] font-medium text-[#9CA3AF]">Streak</p>
            <div className="flex items-end gap-2">
              <p className="flex items-center gap-2 text-[32px] font-semibold leading-none text-[#171717]">
                <Flame className="size-7 text-[#171717]" />
                {stats.streak} days
              </p>
              <p className="pb-1 text-xs font-medium text-[#9CA3AF]">Best: {bestStreak} days</p>
            </div>
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[#171717]">Today&apos;s Review</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {reviewCardsWithFallback.map((topic, idx) => (
              <article
                key={`${topic.name}-${idx}`}
                className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: REVIEW_DOT_COLORS[idx] }}
                  />
                  <p className="text-sm font-semibold text-[#171717]">{topic.name}</p>
                </div>
                <p className="text-[13px] text-[#6B7280]">{topic.dueCount} cards due</p>
                <Button
                  variant="secondary"
                  className="h-7 w-full rounded-md bg-[#F5F5F5] text-xs font-medium text-[#171717] hover:bg-[#EDEDED]"
                  onClick={() => setActiveView("review")}
                  disabled={topic.dueCount === 0}
                >
                  Review
                </Button>
              </article>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-base font-semibold text-[#171717]">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-8 w-full justify-center gap-2 rounded-md border-[#E5E7EB] bg-white text-xs font-medium text-[#171717] hover:bg-[#FAFAFA]"
                    onClick={action.onClick}
                  >
                    <Icon className="size-3.5" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-base font-semibold text-[#171717]">Upcoming Reviews</h2>
            <div className="flex flex-col gap-2">
              {insights.upcomingReviews.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">{item.label}</span>
                  <span
                    className={`font-medium ${
                      item.dueCount >= 20 ? "text-[#F87171]" : "text-[#171717]"
                    }`}
                  >
                    {item.dueCount} cards
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[#171717]">Recent Activity</h2>
          <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5">
            {recentActivity.map((event) => {
              let Icon = Zap;
              let iconColor = "#22C55E";
              let iconBg = "#F0FDF4";

              if (event.type === "library_item_added") {
                Icon = Plus;
                iconColor = "#3B82F6";
                iconBg = "#EFF6FF";
              } else if (event.type === "exercise_completed") {
                if (event.description.toLowerCase().includes("quiz")) {
                  Icon = CircleCheck;
                  iconColor = "#F59E0B";
                  iconBg = "#FFFBEB";
                } else {
                  Icon = Trophy;
                  iconColor = "#7C3AED";
                  iconBg = "#F5F3FF";
                }
              }

              return (
                <div key={event.id} className="flex items-center gap-3">
                  <div
                    className="flex size-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: iconBg }}
                  >
                    <Icon className="size-4" style={{ color: iconColor }} />
                  </div>
                  <p className="text-sm text-[#171717]">{event.description}</p>
                  <span className="ml-auto shrink-0 text-[13px] text-[#9CA3AF]">
                    {formatRelativeTime(event.timestamp, nowTs)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
