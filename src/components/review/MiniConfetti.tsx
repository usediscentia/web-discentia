"use client";

import { motion } from "motion/react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotate: number;
  size: number;
}

interface MiniConfettiProps {
  trigger: boolean;
  colors?: string[];
  count?: number;
}

const DEFAULT_COLORS = [
  "#34D399", "#60A5FA", "#FACC15", "#F87171", "#A78BFA", "#FB923C",
];

function buildParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI + (i % 3) * 0.3;
    const spread = 0.6 + (i % 4) * 0.15;
    return {
      id: i,
      x: Math.cos(angle) * 75 * spread,
      y: Math.sin(angle) * 55 * spread - 25,
      color: colors[i % colors.length],
      rotate: i * 43,
      size: 5 + (i % 3) * 2,
    };
  });
}

export function MiniConfetti({
  trigger,
  colors = DEFAULT_COLORS,
  count = 10,
}: MiniConfettiProps) {
  if (!trigger) return null;

  const particles = buildParticles(count, colors);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ backgroundColor: p.color, width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            scale: [0, 1, 0.6],
            rotate: p.rotate,
          }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
