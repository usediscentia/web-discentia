"use client";

import { motion } from "motion/react";
import { ParentSize } from "@visx/responsive";
import HeatmapChart from "@/components/ui/heatmap-chart";

interface ReviewHeatmapProps {
  activityByDay: Record<string, number>;
}

const LEGEND_OPACITIES = [0.12, 0.3, 0.55, 0.78, 1];

export default function ReviewHeatmap({ activityByDay }: ReviewHeatmapProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      className="flex w-full flex-col gap-3 rounded-[12px] border border-[#E8E5E0] bg-white p-4"
    >
      <div className="flex w-full items-center justify-between">
        <span
          className="text-[13px] font-medium uppercase text-[#9C9690]"
          style={{ letterSpacing: 0.1 }}
        >
          Activity Overview
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[#9C9690]">Less</span>
          {LEGEND_OPACITIES.map((opacity) => (
            <div
              key={opacity}
              className="size-[10px] rounded-[2px]"
              style={{ backgroundColor: "var(--brand)", opacity }}
            />
          ))}
          <span className="text-[11px] text-[#9C9690]">More</span>
        </div>
      </div>

      <ParentSize>
        {({ width }) => (
          <HeatmapChart activityByDay={activityByDay} width={width} />
        )}
      </ParentSize>
    </motion.div>
  );
}
