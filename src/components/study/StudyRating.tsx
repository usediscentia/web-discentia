"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sm2 } from "@/lib/sm2";
import type { ReviewRating } from "@/lib/sm2";
import type { SRSCard } from "@/types/srs";
import { RotateCcw, Check, Smile, ArrowRight } from "lucide-react";
import { useAppearanceStore } from "@/stores/appearance.store";

const THUMB_SIZE = 44;
const SNAP_PCTS = [0, 0.5, 1] as const;

interface StudyRatingProps {
  card: SRSCard;
  onRate: (rating: ReviewRating) => void;
}

function getIntervalLabel(card: SRSCard, rating: ReviewRating): string {
  const updated = sm2(card, rating);
  const days = updated.interval;
  if (days <= 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "in 1 week" : `in ${weeks} weeks`;
}

function getZoneIndex(pct: number): number {
  if (pct < 1 / 3) return 0;
  if (pct < 2 / 3) return 1;
  return 2;
}

const ZONES = [
  {
    id: "hard" as ReviewRating,
    label: "Hard",
    Icon: RotateCcw,
    color: "#F43F5E",
    fillColor: "rgba(244,63,94,0.11)",
  },
  {
    id: "good" as ReviewRating,
    label: "Good",
    Icon: Check,
    color: "#0EA5E9",
    fillColor: "rgba(14,165,233,0.11)",
  },
  {
    id: "easy" as ReviewRating,
    label: "Easy",
    Icon: Smile,
    color: "#10B981",
    fillColor: "rgba(16,185,129,0.11)",
  },
] as const;

export function StudyRating({ card, onRate }: StudyRatingProps) {
  const accentColor = useAppearanceStore((s) => s.accentColor);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbPct, setThumbPct] = useState(0);
  const [zoneIndex, setZoneIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapped, setIsSnapped] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const dragging = useRef(false);
  const lastZone = useRef(-1);

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

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setIsDragging(true);
    setIsSnapped(false);
    setConfirmed(false);
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

  const handlePointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    setZoneIndex((zi) => {
      if (zi !== null) {
        setThumbPct(SNAP_PCTS[zi]);
        setIsSnapped(true);
      }
      return zi;
    });
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement
      ) return;

      const selectZone = (zi: number) => {
        setZoneIndex(zi);
        setThumbPct(SNAP_PCTS[zi]);
        setIsSnapped(true);
        setConfirmed(false);
      };

      if (e.key === "1") selectZone(0);
      else if (e.key === "2") selectZone(1);
      else if (e.key === "3") selectZone(2);
      else if (e.key === "Enter" && isSnapped && zoneIndex !== null && !confirmed) {
        setConfirmed(true);
        onRate(ZONES[zoneIndex].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRate, isSnapped, zoneIndex, confirmed]);

  const activeZone = zoneIndex !== null ? ZONES[zoneIndex] : null;
  const thumbX = thumbPct * usable;
  const fillWidth = zoneIndex !== null ? thumbX + THUMB_SIZE / 2 : 0;

  // Instant during drag, spring on snap
  const transition = isDragging
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 500, damping: 32 };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400/70 text-center">
        How well did you recall this?
      </p>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative select-none touch-none rounded-full bg-gray-100 w-3/4 mx-auto"
        style={{ height: 52, cursor: isDragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={zoneIndex ?? 0}
        aria-valuetext={activeZone?.label ?? "none"}
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

        {/* Zone labels */}
        {ZONES.map((z, i) => (
          <span
            key={z.id}
            className="absolute top-1/2 text-[11px] font-medium pointer-events-none select-none transition-opacity duration-150 text-gray-500"
            style={{
              transform: i === 1
                ? "translateX(-50%) translateY(-50%)"
                : "translateY(-50%)",
              left: i === 0 ? 18 : i === 1 ? "50%" : undefined,
              right: i === 2 ? 18 : undefined,
              opacity: zoneIndex === i ? 0 : 0.3,
            }}
          >
            {z.label}
          </span>
        ))}

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
                className="text-gray-300 text-xl leading-none select-none"
              >
                ·
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Result + confirm */}
      <div className="h-12 flex items-center">
        <AnimatePresence mode="wait">
          {activeZone ? (
            <motion.div
              key={activeZone.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="flex items-center justify-between w-full"
            >
              <div>
                <p className="text-sm font-semibold leading-tight" style={{ color: activeZone.color }}>
                  {activeZone.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {getIntervalLabel(card, activeZone.id)}
                </p>
              </div>

              <AnimatePresence>
                {isSnapped && !confirmed && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    onClick={() => { setConfirmed(true); onRate(activeZone.id); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-medium cursor-pointer transition-[opacity] duration-100 hover:opacity-90"
                    style={{ backgroundColor: accentColor }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Confirm
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gray-400 w-full text-center"
            >
              drag to rate
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
