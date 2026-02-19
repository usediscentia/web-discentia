"use client";

import { motion } from "motion/react";
import {
  BookOpenIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export function LibraryEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center flex-1 gap-5 w-full"
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-[20px] bg-[#F3F4F6]">
        <BookOpenIcon className="w-9 h-9 text-[#9CA3AF]" />
      </div>

      <h2 className="text-[22px] font-semibold text-[#1A1A1A] tracking-[-0.3px]">
        Your library is empty
      </h2>

      <p className="text-[15px] text-[#9CA3AF]">
        Add notes, images, files — anything you want to memorize.
      </p>

      <button className="flex items-center gap-2 px-6 py-3 rounded-3xl bg-[#1A1A1A] cursor-pointer hover:bg-[#333] transition-colors">
        <PlusIcon className="w-4 h-4 text-white" />
        <span className="text-sm font-semibold text-white">
          Add your first content
        </span>
      </button>
    </motion.div>
  );
}
