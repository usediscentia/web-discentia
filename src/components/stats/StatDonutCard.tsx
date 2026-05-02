"use client";

const ROSE = "#FB7185";
const TRACK = "#E8E5E0";
const SIZE = 52;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface StatDonutCardProps {
  label: string;
  value: string;
  /** 0–100 fill percentage */
  fill: number;
}

export function StatDonutCard({ label, value, fill }: StatDonutCardProps) {
  const clamped = Math.min(100, Math.max(0, fill));
  const dash = (clamped / 100) * CIRCUMFERENCE;
  const gap = CIRCUMFERENCE - dash;
  const center = SIZE / 2;

  return (
    <div className="flex h-[88px] items-center gap-3 rounded-[12px] border border-[#E8E5E0] bg-white px-4">
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ display: "block" }}
        >
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke={TRACK}
            strokeWidth={STROKE}
          />
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke={ROSE}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        <span className="absolute text-[10px] font-bold leading-none text-[#1A1814] tabular-nums">
          {clamped}%
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] text-[#9C9690] truncate">{label}</span>
        <span className="text-[18px] font-bold leading-tight tracking-tight text-[#1A1814] tabular-nums truncate">
          {value}
        </span>
      </div>
    </div>
  );
}
