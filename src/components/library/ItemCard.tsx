"use client";

import Image from "next/image";
import { Trash2, PencilLine } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useEffect, useCallback, useState } from "react";
import type { LibraryItem } from "@/types/library";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: LibraryItem;
  libraryName: string;
  libraryColor: string;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  onOpenInEditor?: () => void;
  isDragging?: boolean;
  onDragStart?: (
    rect: DOMRect,
    pointerX: number,
    pointerY: number,
    pointerId: number
  ) => void;
}

// Strong ease-out for UI interactions
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const LONG_PRESS_MS = 350;
const CANCEL_THRESHOLD_SQ = 8 * 8;

export function typeBadge(type: string) {
  if (type === "markdown") return "MD";
  if (type === "text") return "TXT";
  if (type === "image") return "IMG";
  if (type === "pdf") return "PDF";
  return type.toUpperCase().slice(0, 3);
}

export default function ItemCard({
  item,
  libraryColor,
  index,
  onOpen,
  onDelete,
  onOpenInEditor,
  isDragging = false,
  onDragStart,
}: ItemCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasThumbnail = item.type === "pdf" && Boolean(item.metadata.thumbnail);

  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const longPressActivatedRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onDragStart || isDragging) return;
      e.preventDefault();
      longPressActivatedRef.current = false;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      setIsPressing(true);
      const pid = e.pointerId;
      const clientX = e.clientX;
      const clientY = e.clientY;
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressActivatedRef.current = true;
        setIsPressing(false);
        if (cardRef.current) {
          onDragStart(
            cardRef.current.getBoundingClientRect(),
            clientX,
            clientY,
            pid
          );
        }
      }, LONG_PRESS_MS);
    },
    [onDragStart, isDragging]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!longPressTimerRef.current) return;
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      if (dx * dx + dy * dy > CANCEL_THRESHOLD_SQ) cancelLongPress();
    },
    [cancelLongPress]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Suppress click that fires right after a long-press activation
      if (longPressActivatedRef.current) {
        longPressActivatedRef.current = false;
        e.stopPropagation();
        return;
      }
      (onOpenInEditor ?? onOpen)();
    },
    [onOpen, onOpenInEditor]
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      animate={{ opacity: isDragging ? 0 : 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.03, 0.15),
        duration: 0.2,
        ease: EASE_OUT,
      }}
      className={cn(
        "group flex flex-col gap-1.5 select-none",
        isDragging
          ? "cursor-grabbing pointer-events-none"
          : "cursor-pointer"
      )}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      style={{ touchAction: onDragStart ? "none" : "auto" }}
    >
      {/* Book Cover */}
      <motion.div
        className="relative aspect-[2/3] rounded-[3px] overflow-hidden"
        // During long-press: scale down linearly (like a progress indicator — you're "charging" the grab)
        // On release: spring back instantly
        animate={{ scale: isPressing ? 0.93 : 1 }}
        whileHover={
          !shouldReduceMotion && !isPressing
            ? { y: -4, boxShadow: "3px 10px 28px rgba(0,0,0,0.30)" }
            : undefined
        }
        transition={
          isPressing
            ? { scale: { duration: LONG_PRESS_MS / 1000, ease: "linear" } }
            : {
                scale: { type: "spring", stiffness: 400, damping: 25 },
                y: { duration: 0.18, ease: EASE_OUT },
                boxShadow: { duration: 0.18, ease: EASE_OUT },
              }
        }
        style={{
          backgroundColor: `color-mix(in oklch, black 42%, ${libraryColor})`,
          boxShadow: "2px 5px 12px rgba(0,0,0,0.18)",
        }}
      >
        {/* Spine */}
        <div
          className="absolute inset-y-0 left-0 w-[4px] z-10"
          style={{
            backgroundColor: `color-mix(in oklch, black 62%, ${libraryColor})`,
          }}
        />
        {/* Page-edge sheen */}
        <div className="absolute inset-y-0 right-0 w-[3px] bg-gradient-to-r from-transparent to-white/10 z-10" />

        {/* Thumbnail for PDFs */}
        {hasThumbnail && (
          <Image
            src={item.metadata.thumbnail!}
            alt={item.title}
            fill
            unoptimized
            className="object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div
          className={cn(
            "absolute inset-0",
            hasThumbnail
              ? "bg-gradient-to-t from-black/80 via-black/20 to-transparent"
              : "bg-gradient-to-t from-black/65 via-black/10 to-transparent"
          )}
        />

        {/* Type badge */}
        <span className="absolute top-1.5 right-2 text-[8px] font-bold tracking-wider text-white/50 z-20">
          {typeBadge(item.type)}
        </span>

        {/* Delete button (hover, non-drag) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1.5 left-1.5 z-20 p-1 rounded bg-black/30 backdrop-blur-sm text-white/50 hover:text-red-400 hover:bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer"
          style={{
            transition:
              "opacity 150ms ease-out, color 150ms ease-out, background-color 150ms ease-out",
          }}
          title="Delete"
        >
          <Trash2 size={10} />
        </button>

        {/* Editor hint */}
        {onOpenInEditor && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenInEditor();
            }}
            className="absolute top-1.5 left-7 z-20 p-1 rounded bg-black/30 backdrop-blur-sm text-white/50 hover:text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer"
            style={{
              transition:
                "opacity 150ms ease-out, color 150ms ease-out, background-color 150ms ease-out",
            }}
            title="Edit"
          >
            <PencilLine size={10} />
          </button>
        )}

        {/* Title on cover */}
        <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
          <p className="text-[8.5px] font-bold text-white leading-snug line-clamp-3">
            {item.title}
          </p>
        </div>
      </motion.div>

      {/* Meta below */}
      <div className="flex items-center gap-1.5 px-0.5">
        <span
          className="shrink-0 size-[5px] rounded-full"
          style={{ backgroundColor: libraryColor }}
        />
        <span className="text-[10px] text-[#888] truncate leading-none">
          {item.title}
        </span>
      </div>
    </motion.div>
  );
}
