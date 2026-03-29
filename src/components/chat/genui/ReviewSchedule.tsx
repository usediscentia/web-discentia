"use client";

import { Calendar } from "lucide-react";
import { useAppStore } from "@/stores/app.store";

interface ReviewScheduleProps {
  props: {
    items: { label: string; count: number }[];
  };
}

export function ReviewSchedule({ props }: ReviewScheduleProps) {
  const { setActiveView } = useAppStore();
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 max-w-xs">
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar size={13} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Upcoming</span>
      </div>
      {props.items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-gray-500">{item.label}</span>
          <span className="font-medium text-gray-900">{item.count} cards</span>
        </div>
      ))}
      <button
        onClick={() => setActiveView("study")}
        className="w-full mt-1 cursor-pointer rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Estudar agora →
      </button>
    </div>
  );
}
