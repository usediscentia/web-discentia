"use client";

import { useRef, useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { SRSCard } from "@/types/srs";

export interface CardOrbitItem {
  card: SRSCard;
  libraryName: string;
  libraryColor: string;
}

interface CardOrbitProps {
  cards: CardOrbitItem[];
  orbitRadius?: number;
}

const NORMAL_SPEED = 13; // degrees/second — full orbit ~28s
const HOVER_SPEED = 2.5; // degrees/second when hovered
const MAX_CARDS = 14;

export function CardOrbit({ cards, orbitRadius = 265 }: CardOrbitProps) {
  const cardWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const speedRef = useRef(NORMAL_SPEED);
  const angleRef = useRef(-90); // start at top
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isHoveredRef = useRef(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const visibleCards = cards.slice(0, MAX_CARDS);
  const n = visibleCards.length;

  useEffect(() => {
    if (n === 0) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      // Smooth speed lerp — feels like slowing down naturally on hover
      const targetSpeed = isHoveredRef.current ? HOVER_SPEED : NORMAL_SPEED;
      speedRef.current += (targetSpeed - speedRef.current) * Math.min(delta * 4, 0.12);

      angleRef.current = (angleRef.current + speedRef.current * delta) % 360;
      const base = angleRef.current;

      for (let i = 0; i < n; i++) {
        const el = cardWrapperRefs.current[i];
        if (!el) continue;
        const offsetDeg = (360 / n) * i;
        const deg = base + offsetDeg;
        const rad = (deg * Math.PI) / 180;
        const x = Math.cos(rad) * orbitRadius;
        const y = Math.sin(rad) * orbitRadius;
        el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [n, orbitRadius]);

  if (n === 0) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {visibleCards.map((info, i) => {
          const offsetDeg = (360 / n) * i;
          const initRad = ((-90 + offsetDeg) * Math.PI) / 180;
          const initX = Math.cos(initRad) * orbitRadius;
          const initY = Math.sin(initRad) * orbitRadius;

          // Slight tilt — varies by position, keeps cards from feeling robotic
          const tilt = Math.sin(initRad) * 10 + Math.cos(initRad * 2) * 4;

          const isHovered = hoveredIndex === i;

          return (
            <div
              key={info.card.id}
              ref={(el) => {
                cardWrapperRefs.current[i] = el;
              }}
              className="absolute pointer-events-auto"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% + ${initX}px), calc(-50% + ${initY}px))`,
                zIndex: isHovered ? 20 : 1,
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onMouseEnter={() => {
                      isHoveredRef.current = true;
                      setHoveredIndex(i);
                    }}
                    onMouseLeave={() => {
                      isHoveredRef.current = false;
                      setHoveredIndex(null);
                    }}
                    className="w-[88px] h-[58px] rounded-md cursor-default select-none flex flex-col overflow-hidden"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderBottom: `2px solid ${info.libraryColor}`,
                      transform: `rotate(${tilt}deg) scale(${isHovered ? 1.12 : 1}) translateY(${isHovered ? -6 : 0}px)`,
                      transition:
                        "transform 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms ease-out, box-shadow 160ms ease-out",
                      boxShadow: isHovered
                        ? "0 12px 32px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.12)"
                        : "0 1px 4px rgba(0,0,0,0.12), 0 0 0 0 transparent",
                      opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                    }}
                  >
                    <p
                      className="flex-1 flex items-center px-2 py-1.5 text-[7px] leading-[1.4] font-medium line-clamp-3"
                      style={{ color: "var(--card-foreground)" }}
                    >
                      {info.card.front.slice(0, 65)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: info.libraryColor }}
                    />
                    {info.libraryName}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
