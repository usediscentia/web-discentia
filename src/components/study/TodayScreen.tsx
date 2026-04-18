"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  BookOpen,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudyStore } from "@/stores/study.store";
import { useAppStore } from "@/stores/app.store";
import type { StudyBreakdown, StudyWeekDay } from "@/stores/study.store";

const RING_COLORS = {
  newColor: "#1A7A6D",
  reviewColor: "#FBBF24",
  overdueColor: "#F87171",
  track: "#E8E5E0",
} as const;

function formatHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(date)
    .toUpperCase();
}

function formatWeekRange(week: StudyWeekDay[]): string {
  if (week.length === 0) return "";
  const start = new Date(week[0].dateKey);
  const end = new Date(week[week.length - 1].dateKey);
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${fmt.format(start)} — ${fmt.format(end)}`;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function estimatedMinutes(cardCount: number): number {
  return Math.max(1, Math.round(cardCount * 0.85));
}

interface RingProps {
  total: number;
  breakdown: StudyBreakdown;
}

function BreakdownRing({ total, breakdown }: RingProps) {
  const r = 60;
  const cx = 72;
  const cy = 72;
  const circumference = 2 * Math.PI * r;
  const safeTotal = Math.max(total, 1);
  const newLen = (breakdown.newCount / safeTotal) * circumference;
  const reviewLen = (breakdown.reviewCount / safeTotal) * circumference;
  const overdueLen = (breakdown.overdueCount / safeTotal) * circumference;

  return (
    <div className="relative" style={{ width: 144, height: 144 }}>
      <svg
        width="144"
        height="144"
        viewBox="0 0 144 144"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={RING_COLORS.track} strokeWidth="12" />
        {breakdown.newCount > 0 && (
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={RING_COLORS.newColor} strokeWidth="12"
            strokeDasharray={`${newLen} ${circumference}`} strokeDashoffset={0}
            strokeLinecap="butt"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${newLen} ${circumference}` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />
        )}
        {breakdown.reviewCount > 0 && (
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={RING_COLORS.reviewColor} strokeWidth="12"
            strokeDasharray={`${reviewLen} ${circumference}`} strokeDashoffset={-newLen}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${reviewLen} ${circumference}` }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          />
        )}
        {breakdown.overdueCount > 0 && (
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={RING_COLORS.overdueColor} strokeWidth="12"
            strokeDasharray={`${overdueLen} ${circumference}`} strokeDashoffset={-(newLen + reviewLen)}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${overdueLen} ${circumference}` }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[28px] leading-none font-bold tracking-[-0.02em] tabular-nums text-[#1A1814]">
          {total}
        </div>
        <div className="mt-1 text-[10px] uppercase text-[#9C9690]" style={{ letterSpacing: 1 }}>
          due
        </div>
      </div>
    </div>
  );
}

interface WeekGraphProps {
  data: StudyWeekDay[];
}

function WeekGraph({ data }: WeekGraphProps) {
  if (data.length === 0) return null;

  const BRAND = "#1A7A6D";
  const INK_1 = "#1A1814";
  const INK_4 = "#9C9690";
  const INK_5 = "#C9C4BE";
  const LINE = "#E8E5E0";
  const LINE_SOFT = "#F0ECE8";
  const SANS = "ui-sans-serif, system-ui, -apple-system, sans-serif";

  const maxLoad = Math.max(...data.map((d) => d.loadCount), 6);
  const yMax = Math.max(Math.ceil(maxLoad / 4) * 4, 12);
  const width = 700;
  const height = 240;
  const top = 20;
  const bottom = 200;
  const stepX = width / (data.length - 1);

  const yFor = (count: number) =>
    bottom - (Math.min(count, yMax) / yMax) * (bottom - top);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: yFor(d.loadCount),
    day: d,
  }));

  const todayIndex = data.findIndex((d) => d.isToday);
  const safeTodayIndex = todayIndex === -1 ? 0 : todayIndex;

  const pastPath = points
    .slice(0, safeTodayIndex + 1)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const futurePath = points
    .slice(safeTodayIndex)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const yMid = Math.round(yMax / 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="study-area-past" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.14" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="study-area-future" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={INK_4} stopOpacity="0.12" />
          <stop offset="100%" stopColor={INK_4} stopOpacity="0" />
        </linearGradient>
      </defs>

      <line x1="0" y1={bottom} x2={width} y2={bottom} stroke={LINE} strokeWidth="1" />
      <line x1="0" y1={(top + bottom) / 2} x2={width} y2={(top + bottom) / 2} stroke={LINE_SOFT} strokeWidth="1" strokeDasharray="2 4" />
      <line x1="0" y1={top + 30} x2={width} y2={top + 30} stroke={LINE_SOFT} strokeWidth="1" strokeDasharray="2 4" />

      <text x="4" y={top + 34} fontFamily={SANS} fontSize="9" fill={INK_4}>{yMax}</text>
      <text x="4" y={(top + bottom) / 2 + 4} fontFamily={SANS} fontSize="9" fill={INK_4}>{yMid}</text>

      {safeTodayIndex >= 0 && (
        <path
          d={`${points
            .slice(0, safeTodayIndex + 1)
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ")} L ${points[safeTodayIndex].x} ${bottom} L ${points[0].x} ${bottom} Z`}
          fill="url(#study-area-past)"
        />
      )}

      {safeTodayIndex < points.length - 1 && (
        <path
          d={`${points
            .slice(safeTodayIndex)
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ")} L ${points[points.length - 1].x} ${bottom} L ${points[safeTodayIndex].x} ${bottom} Z`}
          fill="url(#study-area-future)"
        />
      )}

      <motion.path
        d={pastPath}
        fill="none"
        stroke={BRAND}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      />

      {safeTodayIndex < points.length - 1 && (
        <motion.path
          d={futurePath}
          fill="none"
          stroke={INK_4}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
        />
      )}

      <line
        x1={points[safeTodayIndex].x} y1={top}
        x2={points[safeTodayIndex].x} y2={bottom}
        stroke={INK_1} strokeWidth="1" strokeDasharray="3 3" opacity="0.25"
      />

      {points.map((p, i) => {
        if (p.day.isToday) {
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="10" fill={BRAND} opacity="0.18" />
              <circle cx={p.x} cy={p.y} r="5" fill={INK_1} />
            </g>
          );
        }
        if (p.day.isPast) {
          return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke={BRAND} strokeWidth="2" />;
        }
        return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke={INK_5} strokeWidth="1.5" />;
      })}

      {points.map((p, i) => {
        const base = { fontFamily: SANS, fontSize: 10 } as const;
        if (p.day.isToday) {
          return (
            <text key={i} x={p.x} y={225} textAnchor="middle" fill={INK_1} fontWeight="600" {...base}>
              {p.day.loadCount} today
            </text>
          );
        }
        if (p.day.isPast) {
          return <text key={i} x={p.x} y={225} textAnchor="middle" fill={INK_4} {...base}>{p.day.reviewedCount} ✓</text>;
        }
        return <text key={i} x={p.x} y={225} textAnchor="middle" fill={INK_5} {...base}>{p.day.loadCount}</text>;
      })}
    </svg>
  );
}

function DayPills({ data }: { data: StudyWeekDay[] }) {
  return (
    <div className="grid grid-cols-7 gap-1 mt-3">
      {data.map((d) => {
        const isToday = d.isToday;
        const isPast = d.isPast;
        const cellLabel = isPast
          ? `${d.reviewedCount} ✓`
          : isToday
            ? `${d.loadCount} due`
            : `${d.loadCount} est.`;

        return (
          <div
            key={d.dateKey}
            className="text-center px-1.5 py-2.5 rounded-[10px] cursor-default"
            style={{ background: isToday ? "#1A1814" : "transparent" }}
          >
            <div
              className="text-[10px] uppercase font-medium"
              style={{
                letterSpacing: "0.1em",
                color: isToday ? "rgba(250,250,248,0.55)" : isPast ? "#C9C4BE" : "#9C9690",
              }}
            >
              {d.dayLabel}
            </div>
            <div
              className="text-[26px] leading-none mt-0.5"
              style={{ color: isToday ? "#FAFAF8" : isPast ? "#C9C4BE" : "#1A1814" }}
            >
              {d.dateNumber}
            </div>
            {isToday && (
              <div className="w-1 h-1 rounded-full mx-auto mt-1.5 bg-[#1A7A6D]" />
            )}
            <div
              className="mt-1.5 text-[11px] tabular-nums"
              style={{
                color: isToday ? "rgba(250,250,248,0.55)" : isPast ? "#C9C4BE" : "#9C9690",
              }}
            >
              {cellLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TodayScreen() {
  const {
    cards,
    streak,
    bestStreak,
    reviewedToday,
    reviewedThisWeek,
    totalCardsInSystem,
    nextSessionDate,
    nextSessionCount,
    dueByLibrary,
    breakdown,
    weekData,
    startReview,
  } = useStudyStore();

  const setActiveView = useAppStore((s) => s.setActiveView);

  const today = new Date();
  const hasDueCards = cards.length > 0;
  const hasAnyCards = totalCardsInSystem > 0;

  if (!hasAnyCards) {
    return (
      <EditorialEmptyState
        icon={<BookOpen size={28} className="text-muted-foreground" />}
        iconBg="bg-muted"
        title="No content yet."
        body="Upload a PDF or paste text — AI does the rest."
        action={
          <Button onClick={() => setActiveView("library")}>
            Create my first deck
          </Button>
        }
      />
    );
  }

  if (!hasDueCards) {
    return (
      <EditorialEmptyState
        icon={<CheckCircle2 size={28} className="text-emerald-500" />}
        iconBg="bg-emerald-500/10"
        iconRound
        title="All caught up for today."
        body={
          nextSessionDate
            ? `Next review ${formatFutureDate(nextSessionDate)} · ${nextSessionCount} ${nextSessionCount === 1 ? "card" : "cards"}.`
            : undefined
        }
        action={
          streak > 0 ? (
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2"
              style={{ background: "rgba(251,146,60,0.08)", borderColor: "rgba(251,146,60,0.2)" }}
            >
              <Flame size={14} className="text-orange-500" />
              <span className="text-sm font-medium text-orange-600">
                {streak === 1 ? "Streak started!" : `${streak} day streak!`}
              </span>
            </div>
          ) : null
        }
      />
    );
  }

  const total = cards.length;
  const minutes = estimatedMinutes(total);
  const libraryCount = dueByLibrary.length;
  const greeting = getGreeting(today.getHours());

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#FAFAF8]">
      <div
        className="mx-auto flex w-full max-w-[1200px] flex-col"
        style={{ padding: "32px 48px", gap: 24 }}
      >
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex w-full items-center justify-between"
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] font-semibold text-[#1A1814]">{greeting}.</h1>
            <p className="text-[16px] text-[#6B6560]">
              {total === 1
                ? `One card is waiting — about ${minutes} minute of focused review.`
                : `${total} cards are waiting — about ${minutes} minutes of focused review.`}
            </p>
          </div>
          <span
            className="text-[13px] font-medium text-[#9C9690]"
            style={{ letterSpacing: 0.1 }}
          >
            {formatHeaderDate(today)}
          </span>
        </motion.div>

        {/* HERO: DUE TODAY */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-[12px] border border-[#E8E5E0] bg-white p-6"
        >
          <div className="flex items-center justify-between gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-medium text-[#9C9690]" style={{ letterSpacing: 1 }}>
                Due today
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[56px] leading-none font-bold tracking-[-0.03em] tabular-nums text-[#1A1814]">
                  {total}
                </span>
                <span className="text-[16px] font-medium text-[#6B6560]">
                  {total === 1 ? "card" : "cards"}
                </span>
              </div>
              <p className="text-[14px] text-[#6B6560]">
                Estimated{" "}
                <span className="font-medium text-[#1A1814] tabular-nums">~{minutes} min</span>
                {libraryCount > 0 && (
                  <>
                    {" · across "}
                    <span className="font-medium text-[#1A1814]">{libraryCount}</span>{" "}
                    {libraryCount === 1 ? "library" : "libraries"}
                  </>
                )}
              </p>
              <div>
                <Button onClick={startReview} className="gap-2 cursor-pointer">
                  Start review <ArrowRight size={14} />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <BreakdownRing total={total} breakdown={breakdown} />
              <div className="flex flex-col gap-2.5 text-[13px]">
                <LegendRow swatch={RING_COLORS.newColor} name="New" count={breakdown.newCount} />
                <LegendRow swatch={RING_COLORS.reviewColor} name="Review" count={breakdown.reviewCount} />
                <LegendRow swatch={RING_COLORS.overdueColor} name="Overdue" count={breakdown.overdueCount} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* THE WEEK */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase font-medium text-[#9C9690]" style={{ letterSpacing: 1 }}>
                The week ahead
              </span>
              <h2 className="text-[20px] font-semibold text-[#1A1814] tracking-tight mt-0.5">
                What&apos;s behind you, what&apos;s coming.
              </h2>
              <p className="text-[13px] text-[#6B6560] mt-0.5">
                {formatWeekRange(weekData)} · {reviewedThisWeek + total} cards total
              </p>
            </div>
            <WeekNav />
          </div>
          <div className="rounded-[12px] border border-[#E8E5E0] bg-white p-6">
            <div style={{ position: "relative", height: 240 }}>
              <WeekGraph data={weekData} />
            </div>
            <DayPills data={weekData} />
          </div>
        </motion.div>

        {/* LIBRARY WEIGHT */}
        {dueByLibrary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-[10px] uppercase font-medium text-[#9C9690]" style={{ letterSpacing: 1 }}>
                  Today, by library
                </span>
                <h2 className="text-[20px] font-semibold text-[#1A1814] tracking-tight mt-0.5">
                  Where the weight is.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("library")}
                className="text-[13px] font-medium text-[#1A7A6D] cursor-pointer bg-transparent border-none"
                style={{ transition: "opacity 150ms ease-out" }}
              >
                Open library →
              </button>
            </div>
            <div className="rounded-[12px] border border-[#E8E5E0] bg-white p-6">
              <LibraryRows entries={dueByLibrary} />
            </div>
          </motion.div>
        )}

        {/* STREAK STRIP */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <StatCell
            index={0}
            value={String(streak)}
            label="Day streak"
            sublabel={
              streak > 0 && streak >= bestStreak
                ? "↑ Best in memory"
                : bestStreak > 0
                  ? `Best: ${bestStreak} days`
                  : "Begin a streak today"
            }
            highlightSub={streak > 0 && streak >= bestStreak}
            valuePrefix={
              streak > 0 ? <Flame size={16} className="text-[#F59E0B]" /> : undefined
            }
          />
          <StatCell
            index={1}
            value={String(reviewedToday)}
            label="Reviewed today"
            sublabel={
              total > 0
                ? `${total} ${total === 1 ? "card" : "cards"} still due`
                : "All caught up"
            }
          />
          <StatCell
            index={2}
            value={String(reviewedThisWeek)}
            label="Reviewed this week"
            sublabel={total > 0 ? `${total} remaining today` : "Nothing due right now"}
          />
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────

function LegendRow({
  swatch,
  name,
  count,
}: {
  swatch: string;
  name: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="rounded-[2px]" style={{ width: 10, height: 10, background: swatch }} />
      <span className="font-medium text-[#1A1814] min-w-[56px]">{name}</span>
      <span className="text-[#6B6560] tabular-nums text-[12px]">
        {count} {count === 1 ? "card" : "cards"}
      </span>
    </div>
  );
}

function WeekNav() {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-[#E8E5E0] bg-white p-1"
    >
      <button
        type="button"
        aria-label="Previous"
        className="inline-flex items-center justify-center rounded-full w-8 h-8 text-[#6B6560] cursor-pointer bg-transparent border-none"
        style={{ transition: "background 150ms ease-out" }}
      >
        <ChevronLeft size={14} />
      </button>
      <span className="px-2.5 text-[12px] font-medium text-[#1A1814]" style={{ letterSpacing: "-0.1px" }}>
        This week
      </span>
      <button
        type="button"
        aria-label="Next"
        className="inline-flex items-center justify-center rounded-full w-8 h-8 text-[#6B6560] cursor-pointer bg-transparent border-none"
        style={{ transition: "background 150ms ease-out" }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function LibraryRows({
  entries,
}: {
  entries: { libraryId: string | null; name: string; color: string; count: number }[];
}) {
  const max = Math.max(...entries.map((e) => e.count), 1);
  return (
    <div className="flex flex-col gap-3.5">
      {entries.map((entry, i) => {
        const widthPct = (entry.count / max) * 100;
        return (
          <div
            key={entry.libraryId ?? `__${i}`}
            className="grid items-center gap-6"
            style={{
              gridTemplateColumns: "200px 1fr 80px",
              padding: "10px 0",
              borderBottom: i === entries.length - 1 ? "none" : "1px solid #E8E5E0",
            }}
          >
            <div className="flex items-center gap-2.5 text-[15px] text-[#1A1814] font-medium">
              <span
                className="rounded-[3px] shrink-0"
                style={{ width: 9, height: 9, background: entry.color }}
              />
              <span className="truncate">{entry.name}</span>
            </div>
            <div className="relative h-1.5 bg-[#E8E5E0] rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${entry.color}, ${entry.color}88)`,
                  transformOrigin: "left",
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: widthPct / 100 }}
                transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
            <div className="text-right">
              <span className="text-[26px] leading-none font-bold tracking-[-0.04em] tabular-nums text-[#1A1814]">
                {entry.count}
              </span>
              <span className="text-[11px] text-[#9C9690] ml-0.5">
                {entry.count === 1 ? "card" : "cards"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCell({
  value,
  label,
  sublabel,
  highlightSub = false,
  valuePrefix,
  index,
}: {
  value: string;
  label: string;
  sublabel?: string;
  highlightSub?: boolean;
  valuePrefix?: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 + index * 0.04 }}
      className="flex flex-col gap-2 rounded-[10px] border border-[#E8E5E0] bg-[#F7F5F2] p-4"
    >
      <div className="flex items-center gap-1.5">
        {valuePrefix}
        <span className="text-[48px] leading-none font-bold tracking-[-0.02em] tabular-nums text-[#1A1814]">
          {value}
        </span>
      </div>
      <span className="text-[10px] font-medium uppercase text-[#9C9690]" style={{ letterSpacing: 1 }}>
        {label}
      </span>
      {sublabel && (
        <Badge
          variant="secondary"
          className={`h-auto rounded-[4px] bg-transparent px-0 text-[11px] font-normal shadow-none ${
            highlightSub ? "text-[#22C55E]" : "text-[#9C9690]"
          }`}
        >
          {sublabel}
        </Badge>
      )}
    </motion.div>
  );
}

function EditorialEmptyState({
  icon,
  iconBg,
  iconRound,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconRound?: boolean;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center px-4 bg-[#FAFAF8]">
      <motion.div
        className="flex flex-col items-center gap-5 text-center max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <motion.div
          className={`w-16 h-16 ${iconRound ? "rounded-full" : "rounded-2xl"} ${iconBg} flex items-center justify-center`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
        >
          {icon}
        </motion.div>
        <div>
          <p className="text-[28px] font-semibold text-[#1A1814] leading-tight tracking-tight">
            {title}
          </p>
          {body && (
            <p className="text-[14px] text-[#6B6560] mt-2 leading-relaxed">{body}</p>
          )}
        </div>
        {action}
      </motion.div>
    </div>
  );
}

function formatFutureDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(timestamp);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 1) return "tomorrow";
  if (diffDays <= 7) return `in ${diffDays} days`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
