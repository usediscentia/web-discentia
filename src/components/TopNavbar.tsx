"use client";

import { motion } from "motion/react";
import { DiscentiaLogo } from "@/components/brand/DiscentiaLogo";

interface TopNavbarProps {
  activeTab: "chat" | "library";
  onTabChange: (tab: "chat" | "library") => void;
}

export function TopNavbar({ activeTab, onTabChange }: TopNavbarProps) {
  return (
    <header className="flex items-center justify-between h-14 px-8 border-b border-[#E5E7EB] w-full shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111111]">
          <DiscentiaLogo size={18} className="text-white" alt="Discentia" />
        </div>
        <span className="text-[#1A1A1A] text-lg font-light tracking-[2px]">
          discentia
        </span>
      </div>

      <nav className="flex items-center">
        <button
          onClick={() => onTabChange("chat")}
          className="flex flex-col items-center gap-1 px-5 py-4 cursor-pointer"
        >
          <span
            className={`text-sm ${
              activeTab === "chat"
                ? "font-semibold text-[#1A1A1A]"
                : "font-medium text-[#9CA3AF]"
            }`}
          >
            Chat
          </span>
          {activeTab === "chat" && (
            <motion.div
              layoutId="activeTab"
              className="h-0.5 w-8 bg-[#1A1A1A] rounded-[1px]"
            />
          )}
        </button>
        <button
          onClick={() => onTabChange("library")}
          className="flex flex-col items-center gap-1 px-5 py-4 cursor-pointer"
        >
          <span
            className={`text-sm ${
              activeTab === "library"
                ? "font-semibold text-[#1A1A1A]"
                : "font-medium text-[#9CA3AF]"
            }`}
          >
            Library
          </span>
          {activeTab === "library" && (
            <motion.div
              layoutId="activeTab"
              className="h-0.5 w-12 bg-[#1A1A1A] rounded-[1px]"
            />
          )}
        </button>
      </nav>

      <div className="w-20 h-5" />
    </header>
  );
}
