"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CircleCheck,
  Download,
  Loader2,
  Plus,
  Trophy,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import { Button } from "@/components/ui/button";
import type { DashboardStats, DashboardInsights } from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHeaderDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

function formatRelativeTime(ts: number, now: number): string {
  const diff = now - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function trendFromWeeks(insights: DashboardInsights): {
  pct: number;
  direction: "up" | "down" | "flat";
} {
  const { reviewedLast7Days, reviewedPrev7Days } = insights;
  if (reviewedPrev7Days === 0) {
    return reviewedLast7Days > 0
      ? { pct: 100, direction: "up" }
      : { pct: 0, direction: "flat" };
  }
  const change = ((reviewedLast7Days - reviewedPrev7Days) / reviewedPrev7Days) * 100;
  return {
    pct: Math.abs(Math.round(change)),
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

// ---------------------------------------------------------------------------
// Activity icon mapping
// ---------------------------------------------------------------------------

const DOT_COLORS = ["#34D399", "#F87171", "#38BDF8"] as const;

function activityIcon(type: string, description: string) {
  if (type === "srs_review")
    return { Icon: Zap, bg: "#F0FDF4", color: "#22C55E" };
  if (type === "library_item_added")
    return { Icon: Plus, bg: "#EFF6FF", color: "#3B82F6" };
  if (
    type === "exercise_completed" &&
    /boss.?fight|defeated/i.test(description)
  )
    return { Icon: Trophy, bg: "#F5F3FF", color: "#7C3AED" };
  if (type === "exercise_completed")
    return { Icon: CircleCheck, bg: "#FFFBEB", color: "#F59E0B" };
  // fallback
  return { Icon: Zap, bg: "#F0FDF4", color: "#22C55E" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardView() {
  const { setActiveView } = useAppStore();
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
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || !insights) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAFA]">
        <Loader2 size={20} className="animate-spin text-[#9CA3AF]" />
      </div>
    );
  }

  const now = Date.now();
  const retentionRate =
    stats.totalCards > 0
      ? Math.round((stats.masteredCards / stats.totalCards) * 100)
      : 0;
  const trend = trendFromWeeks(insights);

  // Ensure 3 review cards even if fewer libraries have due cards
  const reviewCards = insights.dueByLibrary.slice(0, 3);
  while (reviewCards.length < 3) {
    reviewCards.push({ libraryId: null, name: "—", dueCount: 0 });
  }

  // Fallback activity items
  const activityItems =
    insights.recentActivity.length > 0
      ? insights.recentActivity.slice(0, 4)
      : [
          {
            id: "fallback-1",
            type: "srs_review" as const,
            description: "No recent activity yet",
            timestamp: now,
          },
        ];

  return (
    <div
      className="flex h-full flex-col overflow-y-auto bg-[#FAFAFA]"
      style={{ padding: "32px 48px", gap: 24 }}
    >
      {/* 1. Header */}
      <div className="flex w-full items-center justify-between">
        <h1 className="text-[24px] font-semibold text-[#171717]">Dashboard</h1>
        <span className="text-[14px] text-[#9CA3AF]">
          {formatHeaderDate(now)}
        </span>
      </div>

      {/* 2. Hero Banner */}
      <div
        className="flex w-full items-center justify-between rounded-xl bg-[#171717]"
        style={{ padding: "20px 24px" }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-medium text-white">
            👋 Good morning! You have {stats.dueToday} cards to review today.
          </span>
          <span className="text-[13px] text-[#9CA3AF]">
            Let&apos;s keep your streak going.
          </span>
        </div>
        <Button
          variant="secondary"
          className="bg-white text-[#171717] hover:bg-white/90"
          disabled={stats.dueToday === 0}
          onClick={() => setActiveView("review")}
        >
          Start Review →
        </Button>
      </div>

      {/* 3. Stats Row */}
      <div className="flex w-full gap-4">
        {/* Retention Rate */}
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-[13px] font-medium text-[#9CA3AF]">
            Retention Rate
          </span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-semibold leading-none text-[#171717]">
              {retentionRate}%
            </span>
            <span
              className="text-[12px] font-medium"
              style={{
                color:
                  trend.direction === "up"
                    ? "#22C55E"
                    : trend.direction === "down"
                      ? "#F87171"
                      : "#6B7280",
              }}
            >
              {trend.direction === "up"
                ? "▲"
                : trend.direction === "down"
                  ? "▼"
                  : "—"}{" "}
              {trend.pct}% this week
            </span>
          </div>
        </div>

        {/* Mastered Cards */}
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-[13px] font-medium text-[#9CA3AF]">
            Mastered Cards
          </span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-semibold leading-none text-[#171717]">
              {stats.masteredCards}
            </span>
            <span className="text-[12px] font-medium text-[#6B7280]">
              +{insights.reviewedThisMonth} this month
            </span>
          </div>
        </div>

        {/* Streak */}
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5">
          <span className="text-[13px] font-medium text-[#9CA3AF]">
            Streak
          </span>
          <div className="flex items-end gap-2">
            <span className="text-[32px] font-semibold leading-none text-[#171717]">
              🔥 {stats.streak} days
            </span>
            <span className="text-[12px] font-medium text-[#9CA3AF]">
              Best: {insights.bestStreak} days
            </span>
          </div>
        </div>
      </div>

      {/* 4. Today's Review */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-[18px] font-semibold text-[#171717]">
          Today&apos;s Review
        </h2>
        <div className="flex w-full gap-4">
          {reviewCards.map((lib, i) => (
            <div
              key={lib.libraryId ?? `placeholder-${i}`}
              className="flex flex-1 flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
                />
                <span className="text-[14px] font-semibold text-[#171717]">
                  {lib.name}
                </span>
              </div>
              <span className="text-[13px] text-[#6B7280]">
                {lib.dueCount} cards due
              </span>
              <Button
                variant="secondary"
                className="w-full"
                disabled={lib.dueCount === 0}
                onClick={() => setActiveView("review")}
              >
                Review
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bottom Row — Quick Actions + Upcoming Reviews */}
      <div className="flex w-full gap-4">
        {/* Quick Actions */}
        <div className="flex flex-1 flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-[16px] font-semibold text-[#171717]">
            Quick Actions
          </h3>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveView("library")}
            >
              <Download size={16} />
              Import Content
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveView("library")}
            >
              <Plus size={16} />
              Add Cards
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveView("review")}
            >
              <Zap size={16} />
              Train
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveView("chat")}
            >
              <Bot size={16} />
              Ask AI
            </Button>
          </div>
        </div>

        {/* Upcoming Reviews */}
        <div className="flex flex-1 flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5">
          <h3 className="text-[16px] font-semibold text-[#171717]">
            Upcoming Reviews
          </h3>
          <div className="flex flex-col gap-2">
            {insights.upcomingReviews.map((item) => (
              <div
                key={item.timestamp}
                className="flex w-full items-center justify-between"
              >
                <span className="text-[14px] text-[#6B7280]">
                  {item.label}
                </span>
                <span
                  className="text-[14px] font-medium"
                  style={{
                    color: item.dueCount >= 20 ? "#F87171" : "#171717",
                  }}
                >
                  {item.dueCount} cards
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Recent Activity */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-[18px] font-semibold text-[#171717]">
          Recent Activity
        </h2>
        <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-5">
          {activityItems.map((item) => {
            const { Icon, bg, color } = activityIcon(
              item.type,
              item.description
            );
            return (
              <div
                key={item.id}
                className="flex w-full items-center gap-3"
              >
                <div
                  className="flex shrink-0 items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: bg,
                  }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-[14px] text-[#171717]">
                  {item.description}
                </span>
                <span className="ml-auto shrink-0 text-[13px] text-[#9CA3AF]">
                  {formatRelativeTime(item.timestamp, now)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
