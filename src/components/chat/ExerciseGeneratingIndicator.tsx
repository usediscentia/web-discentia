"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

function ShimmerBar({
  width,
  delay = 0,
  height = 12,
}: {
  width: string;
  delay?: number;
  height?: number;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden bg-[#F3F4F6]"
      style={{ width, height }}
    >
      <motion.div
        className="h-full w-full"
        style={{
          background:
            "linear-gradient(90deg, #F3F4F6 0%, #E9EAED 40%, #F3F4F6 80%)",
          backgroundSize: "300% 100%",
        }}
        animate={{ backgroundPosition: ["150% 0", "-150% 0"] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
          delay,
        }}
      />
    </div>
  );
}

export function ExerciseGeneratingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col w-full rounded-2xl border border-[#E5E7EB] overflow-hidden"
    >
      {/* Header — matches exercise morph header pattern */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#FAFAFA] border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={15} className="text-[#6B7280]" />
          </motion.div>
          <span className="text-[13px] font-medium text-[#6B7280]">
            Generating exercise
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#9CA3AF] font-medium">
            <AnimatedDots />
          </span>
        </div>
      </div>

      {/* Body — skeleton that mirrors a quiz card layout */}
      <div className="flex flex-col gap-5 p-6 bg-white">
        {/* Question skeleton */}
        <div className="flex flex-col gap-2">
          <ShimmerBar width="85%" height={14} />
          <ShimmerBar width="60%" height={14} delay={0.08} />
        </div>

        {/* Option skeletons — mimic quiz answer buttons */}
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3.5"
            >
              <div className="w-6 h-6 rounded-lg bg-[#F3F4F6] shrink-0" />
              <ShimmerBar
                width={["70%", "55%", "65%", "45%"][i]}
                height={12}
                delay={i * 0.06}
              />
            </div>
          ))}
        </div>

        {/* Footer skeleton — mimic bottom action bar */}
        <div className="flex items-center justify-between pt-1">
          <ShimmerBar width="80px" height={10} delay={0.3} />
          <ShimmerBar width="100px" height={32} delay={0.35} />
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[4px] h-[4px] rounded-full bg-[#9CA3AF]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
