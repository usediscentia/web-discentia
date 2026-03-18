"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FlashcardDraft } from "@/stores/generation.store";

interface FlashcardSlideProps {
  card: FlashcardDraft;
  isEditing: boolean;
  onEdit: () => void;
  onSaveEdit: (front: string, back: string) => void;
  onCancelEdit: () => void;
}

export default function FlashcardSlide({
  card,
  isEditing,
  onEdit,
  onSaveEdit,
  onCancelEdit,
}: FlashcardSlideProps) {
  const [revealed, setRevealed] = useState(false);
  const [editFront, setEditFront] = useState(card.front);
  const [editBack, setEditBack] = useState(card.back);

  const handleStartEdit = () => {
    setEditFront(card.front);
    setEditBack(card.back);
    onEdit();
  };

  if (isEditing) {
    return (
      <motion.div
        layout
        className="w-full max-w-[280px] mx-auto rounded-xl bg-white border border-[#E4E3E1] shadow-md p-5 flex flex-col gap-4"
      >
        <div>
          <label className="text-[10px] font-medium text-[#A8A5A0] tracking-widest uppercase mb-1.5 block">
            Front
          </label>
          <textarea
            value={editFront}
            onChange={(e) => setEditFront(e.target.value)}
            rows={3}
            className="w-full text-sm text-[#0C0C0C] bg-[#F8F8F7] border border-[#E4E3E1] rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#A8A5A0]/30"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-[#A8A5A0] tracking-widest uppercase mb-1.5 block">
            Back
          </label>
          <textarea
            value={editBack}
            onChange={(e) => setEditBack(e.target.value)}
            rows={4}
            className="w-full text-sm text-[#5C5A56] bg-[#F8F8F7] border border-[#E4E3E1] rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#A8A5A0]/30"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 text-xs font-medium text-[#7C7974] hover:text-[#3D3B38] rounded-md hover:bg-[#F8F8F7] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSaveEdit(editFront, editBack)}
            className="px-3 py-1.5 text-xs font-medium bg-[#171614] text-white rounded-md hover:bg-[#252422] transition-colors cursor-pointer"
          >
            Save ✓
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      onClick={() => !revealed && setRevealed(true)}
      className={`w-full max-w-[280px] mx-auto h-[380px] rounded-xl bg-white border border-[#E4E3E1] shadow-md flex flex-col items-center justify-center px-6 relative select-none ${
        !revealed ? "cursor-pointer" : ""
      }`}
    >
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="front"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center justify-center text-center flex-1 w-full"
          >
            <p className="text-lg font-medium text-[#0C0C0C] leading-relaxed">
              {card.front}
            </p>
            <span className="absolute bottom-5 text-xs text-[#D3D1CE]">
              tap to reveal
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex flex-col items-center justify-center text-center flex-1 w-full"
          >
            <span className="absolute top-5 text-[10px] font-medium text-[#A8A5A0] tracking-widest uppercase">
              Answer
            </span>
            <p className="text-base text-[#5C5A56] leading-relaxed">
              {card.back}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(false);
              }}
              className="absolute bottom-5 text-xs text-[#A8A5A0] hover:text-[#7C7974] transition-colors cursor-pointer"
            >
              tap to flip back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-click to edit hint */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleStartEdit();
        }}
        className="absolute top-3 right-3 opacity-0 hover:opacity-100 focus:opacity-100 text-[#A8A5A0] hover:text-[#5C5A56] transition-opacity cursor-pointer p-1"
        title="Edit card"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        </svg>
      </button>
    </motion.div>
  );
}
