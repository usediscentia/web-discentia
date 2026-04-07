"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type KeyboardEvent,
} from "react";
import {
  BoltIcon,
  ArrowUpIcon,
  StopIcon,
} from "@heroicons/react/24/outline";

interface InputLibrary {
  id: string;
  name: string;
  color: string;
}

interface InputBarProps {
  disabled?: boolean;
  isStreaming?: boolean;
  onSend?: (message: string) => void;
  onStop?: () => void;
  onAIProviderClick?: () => void;
  libraries?: InputLibrary[];
  selectedLibraryIds?: string[];
  onToggleLibrary?: (id: string) => void;
}

export function InputBar({
  disabled = false,
  isStreaming = false,
  onSend,
  onStop,
  onAIProviderClick,
  libraries = [],
  selectedLibraryIds = [],
  onToggleLibrary,
}: InputBarProps) {
  const [value, setValue] = useState("");
  const [librariesMenuOpen, setLibrariesMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedLibraries = useMemo(
    () => libraries.filter((library) => selectedLibraryIds.includes(library.id)),
    [libraries, selectedLibraryIds]
  );

  useEffect(() => {
    if (!librariesMenuOpen) return;
    const onWindowClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setLibrariesMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onWindowClick);
    return () => window.removeEventListener("mousedown", onWindowClick);
  }, [librariesMenuOpen]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const hasContent = value.trim().length > 0;

  return (
    <div className="flex flex-col items-center w-full gap-2 px-4 pt-3 pb-4 md:px-8 md:pb-6">
      <div className="w-full max-w-[720px] mx-auto flex flex-wrap gap-1.5 min-h-5">
        {selectedLibraries.map((library) => (
          <button
            key={library.id}
            onClick={() => onToggleLibrary?.(library.id)}
            className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border cursor-pointer"
            style={{
              borderColor: library.color,
              backgroundColor: `${library.color}22`,
              color: "#1A1A1A",
            }}
            title="Remove library"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: library.color }}
            />
            {library.name}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-[720px] mx-auto">
        <div className="flex items-center gap-2.5 h-[52px] bg-white rounded-[26px] border border-[#E5E7EB] pl-4 pr-1.5">
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 shrink-0 cursor-pointer ${
              selectedLibraryIds.length > 0 ? "bg-[#34D39922]" : "bg-[#F3F4F6]"
            }`}
            onClick={() => setLibrariesMenuOpen((open) => !open)}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                selectedLibraryIds.length > 0 ? "bg-[#34D399]" : "bg-[#9CA3AF]"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                selectedLibraryIds.length > 0 ? "text-[#146C5A]" : "text-[#9CA3AF]"
              }`}
            >
              {selectedLibraryIds.length > 0
                ? `${selectedLibraryIds.length} libraries`
                : "Add context"}
            </span>
          </button>

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

        {librariesMenuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-[58px] left-0 w-72 bg-white border border-[#E5E7EB] rounded-xl shadow-md p-2 z-30"
          >
            <p className="text-xs font-semibold text-[#444] px-2 py-1">Select libraries</p>
            <div className="max-h-56 overflow-auto">
              {libraries.length === 0 ? (
                <p className="text-xs text-[#888] px-2 py-2">No libraries yet.</p>
              ) : (
                libraries.map((library) => {
                  const checked = selectedLibraryIds.includes(library.id);
                  return (
                    <button
                      key={library.id}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left cursor-pointer ${
                        checked ? "bg-[#F2FBF8]" : "hover:bg-[#F8F8F8]"
                      }`}
                      onClick={() => onToggleLibrary?.(library.id)}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: library.color }}
                      />
                      <span className="text-xs text-[#222] flex-1">{library.name}</span>
                      <input type="checkbox" checked={checked} readOnly />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
