"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { DashboardStats } from "@/types/dashboard";
import { Loader2 } from "lucide-react";

function Heatmap({ data }: { data: Record<string, number> }) {
  const days = 70;
  const today = new Date();
  const cells: { key: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ key, count: data[key] ?? 0 });
  }

  const max = Math.max(...cells.map((c) => c.count), 1);

  const colorFor = (count: number) => {
    if (count === 0) return "#F3F4F6";
    const intensity = count / max;
    if (intensity < 0.33) return "#A7DDD8";
    if (intensity < 0.66) return "#5BB8B0";
    return "#1A7A6D";
  };

  // Group into columns of 7
  const cols: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));

  return (
    <div className="flex gap-1">
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1">
          {col.map((cell) => (
            <div
              key={cell.key}
              title={`${cell.key}: ${cell.count} reviews`}
              className="w-3.5 h-3.5 rounded-[3px] transition-colors"
              style={{ backgroundColor: colorFor(cell.count) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function DashboardView() {
  const { setActiveView } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    StorageService.getDashboardStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-[#9CA3AF]" />
      </div>
    );
  }

  const masteryPct = stats.totalCards > 0
    ? Math.round((stats.masteredCards / stats.totalCards) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#F3F4F6]">
        <div>
          <h1 className="text-xl font-bold text-[#111]">Dashboard</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Track your learning progress and daily review streak.</p>
        </div>
        {stats.dueToday > 0 && (
          <button
            onClick={() => setActiveView("review")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A7A6D] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#15665B] transition-colors"
          >
            Study Now →
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 flex flex-col gap-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { value: String(stats.dueToday), label: "Due Today", highlight: stats.dueToday > 0 },
            { value: String(stats.reviewedToday), label: "Reviewed Today", highlight: false },
            { value: `${stats.streak} 🔥`, label: "Day Streak", highlight: false },
            { value: String(stats.totalCards), label: "Total Cards", highlight: false },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex flex-col gap-1.5"
            >
              <span className={`text-3xl font-bold ${s.highlight ? "text-[#1A7A6D]" : "text-[#111]"}`}>
                {s.value}
              </span>
              <span className="text-xs text-[#6B7280] font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Mastery */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111]">Mastery</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {stats.masteredCards} mastered · {stats.totalCards - stats.masteredCards} learning
              </p>
            </div>
            <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A7A6D] rounded-full transition-all"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
            <div className="flex items-center gap-4">
              {[
                { color: "bg-[#1A7A6D]", label: `Mastered (${stats.masteredCards})` },
                { color: "bg-[#D1FAE5]", label: `Learning (${stats.totalCards - stats.masteredCards})` },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} />
                  <span className="text-xs text-[#6B7280]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity heatmap */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#111]">Activity — Last 10 Weeks</h3>
            </div>
            <Heatmap data={stats.activityByDay} />
          </div>
        </div>
      </div>
    </div>
  );
}
