"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  onFocusChange?: (focused: boolean) => void;
}

export function AnswerInput({ onSubmit, onSkip, onFocusChange }: AnswerInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && value.trim()) {
      e.preventDefault();
      onSubmit(value.trim());
    }
    if (e.key === "Escape") {
      onSkip();
    }
  };

  const handleSubmit = () => {
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        className="relative bg-white rounded-xl border border-gray-200"
        animate={{
          y: isFocused ? -1 : 0,
          borderColor: isFocused ? "#D1D5DB" : "#E5E7EB",
          boxShadow: isFocused
            ? "0 4px 12px rgba(0,0,0,0.07)"
            : "0 1px 3px rgba(0,0,0,0.04)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          rows={2}
          className="w-full resize-none bg-transparent px-5 py-4 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none leading-relaxed"
          style={{ minHeight: 58, maxHeight: 120 }}
        />
        <AnimatePresence>
          {!value && (
            <motion.div
              className="absolute right-4 top-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <kbd className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 font-sans select-none">
                ⌘↵
              </kbd>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          I don&apos;t know
        </button>
        {/* Mobile submit button — shown when there's content */}
        <AnimatePresence>
          {value.trim() && (
            <motion.button
              onClick={handleSubmit}
              className="text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer sm:hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              Submit
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
