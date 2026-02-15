"use client";

import { useState, useCallback } from "react";
import {
  PlusIcon,
  BoltIcon,
  ArrowUpIcon,
  StopIcon,
} from "@heroicons/react/24/outline";

interface InputBarProps {
  contextLabel?: string;
  contextActive?: boolean;
  disabled?: boolean;
  isStreaming?: boolean;
  onSend?: (message: string) => void;
  onStop?: () => void;
  onAIProviderClick?: () => void;
}

export function InputBar({
  contextLabel,
  contextActive = false,
  disabled = false,
  isStreaming = false,
  onSend,
  onStop,
  onAIProviderClick,
}: InputBarProps) {
  const [value, setValue] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const hasContent = value.trim().length > 0;

  return (
    <div className="flex items-center w-full px-8 pt-3 pb-6">
      <div className="flex items-center gap-2.5 w-[720px] mx-auto h-[52px] bg-white rounded-[26px] border border-[#E5E7EB] pl-4 pr-1.5">
        <button className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[#F3F4F6] shrink-0 cursor-pointer hover:bg-[#E5E7EB] transition-colors">
          <PlusIcon className="w-4 h-4 text-[#6B7280]" />
        </button>

        {contextLabel ? (
          <div
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 shrink-0 ${
              contextActive
                ? "bg-[#34D39933]"
                : "bg-[#F3F4F6]"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                contextActive ? "bg-[#34D399]" : "bg-[#9CA3AF]"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                contextActive ? "text-[#1A7A6D]" : "text-[#9CA3AF]"
              }`}
            >
              {contextLabel}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-xl bg-[#F3F4F6] px-2.5 py-1 shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
            <span className="text-xs font-medium text-[#9CA3AF]">
              Add context
            </span>
          </div>
        )}

        <input
          type="text"
          placeholder="Ask anything or generate exercises..."
          className="flex-1 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] bg-transparent outline-none min-w-0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <button
          onClick={onAIProviderClick}
          className="flex items-center justify-center w-9 h-9 rounded-[18px] shrink-0 cursor-pointer hover:bg-[#F3F4F6] transition-colors"
        >
          <BoltIcon className="w-[18px] h-[18px] text-[#9CA3AF]" />
        </button>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex items-center justify-center w-9 h-9 rounded-[18px] bg-[#1A1A1A] shrink-0 cursor-pointer hover:bg-[#333] transition-colors"
          >
            <StopIcon className="w-[18px] h-[18px] text-white" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!hasContent || disabled}
            className={`flex items-center justify-center w-9 h-9 rounded-[18px] shrink-0 transition-colors ${
              hasContent && !disabled
                ? "bg-[#1A1A1A] cursor-pointer hover:bg-[#333]"
                : "bg-[#E5E7EB] cursor-default"
            }`}
          >
            <ArrowUpIcon
              className={`w-[18px] h-[18px] ${
                hasContent && !disabled ? "text-white" : "text-[#9CA3AF]"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
