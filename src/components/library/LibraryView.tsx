"use client";

import { LibraryEmpty } from "@/components/library/LibraryEmpty";
import { LibraryPopulated } from "@/components/library/LibraryPopulated";

export default function LibraryView() {
  // TODO Phase 1: replace with useLibrary hook and real data
  // For now, show the populated demo view
  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA]">
      <LibraryPopulated />
    </div>
  );
}
