"use client";

import { motion } from "motion/react";
import type { DashboardUpcomingReview } from "@/types/dashboard";

interface ReviewForecastProps {
  upcoming: DashboardUpcomingReview[];
}

export default function ReviewForecast({ upcoming }: ReviewForecastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-1 flex-col gap-5 rounded-[12px] border border-[#E8E5E0] bg-white p-6"
    >
      <span
        className="text-[13px] font-medium uppercase text-[#9C9690]"
        style={{ letterSpacing: 1 }}
      >
        Upcoming reviews
      </span>

      <div className="flex flex-col gap-0">
        {upcoming.map((item, index) => {
          const mutedLabel = index >= 2;
          return (
            <div key={`${item.label}-${item.timestamp}`}>
              <div className="flex items-center justify-between py-3">
                <span
                  className="text-[14px]"
                  style={{ color: mutedLabel ? "#6B6560" : "#1A1814" }}
                >
                  {item.label}
                </span>
                <span className="text-[14px] font-semibold text-[#1A1814]">
                  {item.dueCount}
                </span>
              </div>
              {index < upcoming.length - 1 ? (
                <div className="h-px w-full bg-[#F0EDE9]" />
              ) : null}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
