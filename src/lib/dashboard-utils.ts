import type { WeekDayData } from "@/types/dashboard";

export const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PT_DAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function toDayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function buildWeekDayData(
  activityByDay: Record<string, number>,
  weeklyDueCount: Record<string, number>
): WeekDayData[] {
  const MAX_DOTS = 8;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDayKey(today.getTime());

  // Build the 7 days of the current week (Sun–Sat)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const days: Omit<WeekDayData, "dotCount" | "status">[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toDayKey(d.getTime());
    const isPast = d < today;
    const load = isPast
      ? (activityByDay[key] ?? 0)
      : (weeklyDueCount[key] ?? 0);
    days.push({ label: PT_DAY_LABELS[d.getDay()], dateNumber: d.getDate(), dateKey: key, load });
  }

  // 75th-percentile threshold for "heavy" (future days)
  const allLoads = days.map((d) => d.load).sort((a, b) => a - b);
  const p75Index = Math.floor(allLoads.length * 0.75);
  const heavyThreshold = allLoads[p75Index] ?? 0;

  const maxLoad = Math.max(...days.map((d) => d.load), 1);

  return days.map((day) => {
    const isPast = new Date(day.dateKey) < today;
    const isToday = day.dateKey === todayKey;

    let status: WeekDayData["status"];
    if (isToday) {
      status = "today";
    } else if (isPast) {
      status = day.load > 0 ? "completed" : "pending";
    } else {
      status = heavyThreshold > 0 && day.load >= heavyThreshold ? "heavy" : "pending";
    }

    const dotCount = day.load > 0
      ? Math.max(1, Math.round((day.load / maxLoad) * MAX_DOTS))
      : 0;

    return { ...day, dotCount, status };
  });
}

export function buildWeeklyData(activityByDay: Record<string, number>) {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    result.push({ day: DAY_LABELS[d.getDay()], value: activityByDay[key] ?? 0 });
  }
  return result;
}
