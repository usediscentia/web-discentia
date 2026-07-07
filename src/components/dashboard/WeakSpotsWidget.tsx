"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Flame, ChevronRight } from "lucide-react";
import { StorageService } from "@/services/storage";
import { useAppStore } from "@/stores/app.store";
import type { WeakSpot } from "@/types/dashboard";

function DifficultyBar({ score }: { score: number }) {
  return (
    <div className="flex-1 h-1 rounded-full bg-[#F0F0EC] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(score * 100)}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{
          background:
            score > 0.6
              ? "#F87171"
              : score > 0.35
              ? "#FBBF24"
              : "#34D399",
        }}
      />
    </div>
  );
}

export default function WeakSpotsWidget() {
  const [spots, setSpots] = useState<WeakSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveView, setStudyFilterItemId } = useAppStore();

  useEffect(() => {
    StorageService.getWeakSpots().then((data) => {
      setSpots(data);
      setLoading(false);
    });
  }, []);

  const handleStudy = (spot: WeakSpot) => {
    setStudyFilterItemId(spot.libraryItemId);
    setActiveView("study");
  };

  if (loading) {
    return (
      <div className="flex-1 rounded-[12px] border border-[#E8E5E0] bg-white p-5 animate-pulse h-[220px]" />
    );
  }

  if (spots.length === 0) {
    return (
      <div className="flex-1 rounded-[12px] border border-[#E8E5E0] bg-white p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-[#9C9690]" />
          <span className="text-[13px] font-semibold text-[#1A1814]">Weak Spots</span>
        </div>
        <p className="text-[12px] text-[#9C9690] mt-2">
          Review more cards to surface your weakest topics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-[12px] border border-[#E8E5E0] bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Flame size={14} className="text-[#F87171]" />
        <span className="text-[13px] font-semibold text-[#1A1814]">Weak Spots</span>
        <span className="ml-auto text-[11px] text-[#9C9690]">by difficulty</span>
      </div>

      <div className="flex flex-col gap-2">
        {spots.map((spot, i) => (
          <motion.div
            key={spot.libraryItemId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-center gap-3 rounded-[8px] px-2 py-1.5 hover:bg-[#FAFAF8] cursor-pointer transition-colors"
            onClick={() => handleStudy(spot)}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: spot.libraryColor }}
            />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="text-[12px] font-medium text-[#1A1814] truncate">
                {spot.itemTitle}
              </span>
              <div className="flex items-center gap-2">
                <DifficultyBar score={spot.weakScore} />
                <span className="text-[10px] text-[#9C9690] shrink-0">
                  {spot.cardCount} cards
                </span>
              </div>
            </div>
            <ChevronRight
              size={12}
              className="text-[#C8C4BE] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
