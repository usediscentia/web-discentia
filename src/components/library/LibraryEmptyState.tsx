"use client";

import { BookOpen, Plus } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface LibraryEmptyStateProps {
  hasLibraries: boolean;
  onAddContent: () => void;
  onCreateLibrary: () => void;
}

export default function LibraryEmptyState({
  hasLibraries,
  onAddContent,
  onCreateLibrary,
}: LibraryEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-full flex flex-col items-center justify-center text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-5">
        <BookOpen size={32} className="text-[#6B7280]" />
      </div>
      <h2 className="text-xl font-semibold text-[#1A1A1A]">
        Your library is empty
      </h2>
      <p className="text-sm text-[#9CA3AF] mt-2 max-w-xs">
        Add notes, images, files — anything you want to memorize.
      </p>
      <Button
        onClick={hasLibraries ? onAddContent : onCreateLibrary}
        className="mt-6 cursor-pointer"
      >
        <Plus size={16} />
        {hasLibraries ? "Add your first content" : "Create your first library"}
      </Button>
    </motion.div>
  );
}
