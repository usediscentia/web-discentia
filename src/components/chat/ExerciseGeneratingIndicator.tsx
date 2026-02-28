"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

const shimmerBars = [
  { width: "75%", delay: 0 },
  { width: "55%", delay: 0.1 },
  { width: "65%", delay: 0.2 },
];

export function ExerciseGeneratingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-[#E5E7EB] bg-white p-5 w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#F3F0FF]"
        >
          <Sparkles size={18} className="text-[#7C5CFC]" />
        </motion.div>
        <span className="text-sm text-[#6B7280]">
          Generating your exercise
          <AnimatedDots />
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {shimmerBars.map((bar, i) => (
          <div
            key={i}
            className="h-3 rounded-full overflow-hidden bg-[#F3F4F6]"
            style={{ width: bar.width }}
          >
            <motion.div
              className="h-full w-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #E5E7EB 50%, transparent 100%)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
                delay: bar.delay,
              }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-flex w-[18px] ml-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}
