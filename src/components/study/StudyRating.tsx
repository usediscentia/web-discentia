"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sm2 } from "@/lib/sm2";
import type { ReviewRating } from "@/lib/sm2";
import type { SRSCard } from "@/types/srs";
import { RotateCcw, Check, Smile } from "lucide-react";

const THUMB_SIZE = 44;
const SNAP_PCTS = [0, 0.5, 1] as const;

interface StudyRatingProps {
  card: SRSCard;
  onRate: (rating: ReviewRating) => void;
}

function getIntervalLabel(card: SRSCard, rating: ReviewRating): string {
  const updated = sm2(card, rating);
  const days = updated.interval;
  if (days <= 1) return "volta amanhã";
  if (days < 7) return `volta em ${days} dias`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "volta em 1 semana" : `volta em ${weeks} semanas`;
}

function getZoneIndex(pct: number): number {
  if (pct < 1 / 3) return 0;
  if (pct < 2 / 3) return 1;
  return 2;
}

const ZONES = [
  {
    id: "hard" as ReviewRating,
    label: "Difícil",
    Icon: RotateCcw,
    color: "#F43F5E",
    fillColor: "rgba(244,63,94,0.11)",
  },
  {
    id: "good" as ReviewRating,
    label: "Bom",
    Icon: Check,
    color: "#0EA5E9",
    fillColor: "rgba(14,165,233,0.11)",
  },
  {
    id: "easy" as ReviewRating,
    label: "Fácil",
    Icon: Smile,
    color: "#10B981",
    fillColor: "rgba(16,185,129,0.11)",
  },
] as const;

export function StudyRating({ card, onRate }: StudyRatingProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbPct, setThumbPct] = useState(0.5);
  const [zoneIndex, setZoneIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragging = useRef(false);
  const lastZone = useRef(-1);
  const committed = useRef(false);

  // Track width via ResizeObserver
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setTrackWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const usable = Math.max(0, trackWidth - THUMB_SIZE);

  const computePct = useCallback((clientX: number): number => {
    if (!trackRef.current || usable <= 0) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left - THUMB_SIZE / 2) / usable));
  }, [usable]);

  const commit = useCallback((zi: number) => {
    if (committed.current) return;
    committed.current = true;
    setZoneIndex(zi);
    setThumbPct(SNAP_PCTS[zi]);
    onRate(ZONES[zi].id);
  }, [onRate]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (committed.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setIsDragging(true);
    const pct = computePct(e.clientX);
    const zi = getZoneIndex(pct);
    setThumbPct(pct);
    setZoneIndex(zi);
    lastZone.current = zi;
  }, [computePct]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const pct = computePct(e.clientX);
    setThumbPct(pct);
    const zi = getZoneIndex(pct);
    if (zi !== lastZone.current) {
      lastZone.current = zi;
      setZoneIndex(zi);
      if ("vibrate" in navigator) navigator.vibrate(8);
    }
  }, [computePct]);

  // Release commits — the drag itself is the deliberate part
  const handlePointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    if (lastZone.current >= 0) commit(lastZone.current);
  }, [commit]);

  // Keyboard: 1/2/3 rates immediately, no intermediate step
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement
      ) return;

      if (e.key === "1") commit(0);
      else if (e.key === "2") commit(1);
      else if (e.key === "3") commit(2);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commit]);

  const activeZone = zoneIndex !== null ? ZONES[zoneIndex] : null;
  const thumbX = thumbPct * usable;
  const fillWidth = zoneIndex !== null ? thumbX + THUMB_SIZE / 2 : 0;

  // Instant during drag, spring on snap
  const transition = isDragging
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 500, damping: 32 };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#9C9690] text-center">
        Quão bem você lembrou?
      </p>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative select-none touch-none rounded-full bg-[#F0EDE8] w-3/4 mx-auto"
        style={{ height: 52, cursor: isDragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={zoneIndex ?? 0}
        aria-valuetext={activeZone?.label ?? "nenhum"}
        tabIndex={0}
      >
        {/* Colored fill — clipped separately so thumb can overflow */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute left-0 top-0 bottom-0"
            style={{ background: activeZone?.fillColor ?? "transparent" }}
            animate={{ width: fillWidth }}
            transition={transition}
          />
        </div>

        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white pointer-events-none"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            left: 0,
            boxShadow: isDragging
              ? "0 6px 20px rgba(0,0,0,0.13), 0 0 0 0.5px rgba(0,0,0,0.07)"
              : "0 2px 8px rgba(0,0,0,0.09), 0 0 0 0.5px rgba(0,0,0,0.07)",
          }}
          animate={{ x: thumbX, scale: isDragging ? 1.07 : 1 }}
          transition={transition}
        >
          <AnimatePresence mode="wait">
            {activeZone ? (
              <motion.div
                key={activeZone.id}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.1 }}
              >
                <activeZone.Icon
                  size={16}
                  strokeWidth={2.5}
                  style={{ color: activeZone.color }}
                />
              </motion.div>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[#C8C4BE] text-xl leading-none select-none"
              >
                ·
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Zone labels double as one-click targets and document the shortcuts */}
      <div className="w-3/4 mx-auto flex items-center justify-between">
        {ZONES.map((z, i) => {
          const isActive = zoneIndex === i;
          return (
            <button
              key={z.id}
              onClick={() => commit(i)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors duration-150"
              style={{ color: isActive ? z.color : "#9C9690" }}
            >
              <kbd
                className="px-1 rounded border text-[10px] leading-4 transition-colors duration-150"
                style={{
                  borderColor: isActive ? z.color : "#E3DFD8",
                  color: isActive ? z.color : "#9C9690",
                  background: "white",
                }}
              >
                {i + 1}
              </kbd>
              {z.label}
            </button>
          );
        })}
      </div>

      {/* Live preview — shows the consequence while deciding, release commits */}
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {activeZone && (
            <motion.p
              key={activeZone.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="text-xs text-[#9C9690] text-center"
            >
              {getIntervalLabel(card, activeZone.id)}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
