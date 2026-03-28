"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, SkipForward } from "lucide-react";

interface StudyInputProps {
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled?: boolean;
}

export function StudyInput({ onSubmit, onSkip, disabled }: StudyInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your answer..."
        className="min-h-[80px] resize-none text-sm"
        disabled={disabled}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          disabled={disabled}
          className="text-gray-400 hover:text-gray-600"
        >
          <SkipForward size={14} className="mr-1.5" />
          Don&apos;t know
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
        >
          <Send size={14} className="mr-1.5" />
          Check answer
          <kbd className="ml-2 text-[10px] opacity-50">⌘↵</kbd>
        </Button>
      </div>
    </div>
  );
}
