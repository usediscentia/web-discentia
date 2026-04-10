"use client";

import { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { HeatmapRect } from "@visx/heatmap";
import { scaleLinear } from "@visx/scale";
import { AnimatePresence, motion } from "motion/react";

const TOTAL_WEEKS = 26;
const GAP = 3;
const MONTH_LABEL_HEIGHT = 18;
const COLORS_LIGHT = "#EDEDEA";
const COLORS_DARK = "#1A1814";

interface BinDatum {
  bin: number;
  count: number;
  date: Date;
}

interface WeekDatum {
  bin: number;
  bins: BinDatum[];
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface HeatmapChartProps {
  activityByDay: Record<string, number>;
  width: number;
}

export default function HeatmapChart({ activityByDay, width }: HeatmapChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: Date;
    count: number;
  } | null>(null);

  const { binData, months, colorMax, cellSize } = useMemo(() => {
    // Derive cell size from available width
    const computedCell = width > 0 ? Math.floor((width - (TOTAL_WEEKS - 1) * GAP) / TOTAL_WEEKS) : 10;
    const cs = Math.max(6, computedCell);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = TOTAL_WEEKS * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalDays - 1));

    const cursor = new Date(startDate);
    const result: WeekDatum[] = [];
    let maxCount = 0;

    for (let w = 0; w < TOTAL_WEEKS; w++) {
      const bins: BinDatum[] = [];
      for (let d = 0; d < 7; d++) {
        const key = toDayKey(cursor);
        const count = activityByDay[key] ?? 0;
        if (count > maxCount) maxCount = count;
        bins.push({ bin: d, count, date: new Date(cursor) });
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push({ bin: w, bins });
    }

    const monthsArr: { label: string; weekIndex: number }[] = [];
    let lastLabel = "";
    result.forEach((week, weekIndex) => {
      const label = week.bins[0].date.toLocaleString("en-US", { month: "short" });
      if (label !== lastLabel) {
        monthsArr.push({ label, weekIndex });
        lastLabel = label;
      }
    });

    return { binData: result, months: monthsArr.slice(-6), colorMax: maxCount, cellSize: cs };
  }, [activityByDay, width]);

  const svgWidth = TOTAL_WEEKS * (cellSize + GAP) - GAP;
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * (cellSize + GAP);

  const rectColorScale = scaleLinear<string>({
    range: [COLORS_LIGHT, COLORS_DARK],
    domain: [0, colorMax || 1],
  });

  const opacityScale = scaleLinear<number>({
    range: [1, 1],
    domain: [0, colorMax || 1],
  });

  if (width === 0) return null;

  return (
    <div className="relative w-full" style={{ height: svgHeight }}>
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-[#1A1814] px-2.5 py-1 text-[11px] text-[#FAFAF8]"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.count} review{tooltip.count !== 1 ? "s" : ""} on {formatDate(tooltip.date)}
          </motion.div>
        )}
      </AnimatePresence>

      <svg width={svgWidth} height={svgHeight}>
        {/* Month labels */}
        {months.map((month) => (
          <text
            key={`${month.label}-${month.weekIndex}`}
            x={month.weekIndex * (cellSize + GAP)}
            y={MONTH_LABEL_HEIGHT - 4}
            fontSize={9}
            fill="#9C9690"
          >
            {month.label}
          </text>
        ))}

        <Group top={MONTH_LABEL_HEIGHT}>
          <HeatmapRect
            data={binData}
            xScale={(col) => col * (cellSize + GAP)}
            yScale={(row) => row * (cellSize + GAP)}
            colorScale={(d) => (d === 0 ? COLORS_LIGHT : rectColorScale(d))}
            opacityScale={opacityScale}
            binWidth={cellSize + GAP}
            binHeight={cellSize + GAP}
            gap={GAP}
          >
            {(heatmap) =>
              heatmap.map((heatmapBins) =>
                heatmapBins.map((cell) => {
                  const binDatum = cell.bin as BinDatum;
                  return (
                    <rect
                      key={`cell-${cell.row}-${cell.column}`}
                      x={cell.x}
                      y={cell.y}
                      width={cell.width}
                      height={cell.height}
                      rx={2}
                      fill={cell.color ?? COLORS_LIGHT}
                      opacity={cell.opacity ?? 1}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => {
                        const tooltipX = cell.x + cell.width / 2;
                        const tooltipY = MONTH_LABEL_HEIGHT + cell.y - 8;
                        setTooltip({
                          x: tooltipX,
                          y: tooltipY,
                          date: binDatum.date,
                          count: cell.count ?? 0,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })
              )
            }
          </HeatmapRect>
        </Group>
      </svg>
    </div>
  );
}
