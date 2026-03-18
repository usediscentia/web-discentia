"use client";

import { GraduationCap } from "lucide-react";

export default function StudyHistory() {
  // TODO: query exercises for this document from StorageService
  const exercises: unknown[] = [];

  return (
    <div className="rounded-xl border border-[#E4E3E1] bg-white p-6">
      <h3 className="text-sm font-semibold text-[#3D3B38] mb-4">
        Study History
      </h3>

      {exercises.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <GraduationCap size={48} className="text-[#D3D1CE] mb-3" />
          <p className="text-sm text-[#7C7974]">No study sessions yet</p>
          <p className="text-xs text-[#A8A5A0] mt-1">
            Generate your first exercises above to start studying.
          </p>
        </div>
      ) : null}
    </div>
  );
}
