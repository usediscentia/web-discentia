"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { motion } from "motion/react";
import { BookOpen } from "lucide-react";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import { DiscentiaLogo } from "@/components/brand/DiscentiaLogo";
import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@/services/ai/openui";
import { ExerciseGeneratingIndicator } from "@/components/chat/ExerciseGeneratingIndicator";
import type { Citation } from "@/types/chat";
import { stripCitationsBlock } from "@/lib/citations";

/** Returns true if the text contains a valid OpenUI Lang root statement. */
function hasOpenUIContent(text: string): boolean {
  return /^\s*root\s*=/m.test(text);
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  morphContent?: ReactNode;
  provider?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
  isGeneratingExercise?: boolean;
  onOpenCitation?: (citation: Citation) => void;
  highlightMessageId?: string | null;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
  isGeneratingExercise,
  onOpenCitation,
  highlightMessageId,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 120;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(nearBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkNearBottom, { passive: true });
    return () => el.removeEventListener("scroll", checkNearBottom);
  }, [checkNearBottom]);

  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, isNearBottom]);

  // Always scroll to bottom when a new user message is sent
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      const timeout = window.setTimeout(() => setIsNearBottom(true), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to and flash highlighted message
  useEffect(() => {
    if (!highlightMessageId) return;
    const el = messageRefs.current[highlightMessageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const flashTimeout = window.setTimeout(() => setFlashId(highlightMessageId), 0);
      const clearTimeoutId = window.setTimeout(() => setFlashId(null), 2000);
      return () => {
        window.clearTimeout(flashTimeout);
        window.clearTimeout(clearTimeoutId);
      };
    }
  }, [highlightMessageId]);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col items-center flex-1 overflow-y-auto w-full px-0 py-6"
    >
      <div className="flex flex-col gap-5 w-full max-w-[720px] px-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            ref={(el: HTMLDivElement | null) => { messageRefs.current[message.id] = el; }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
            className={flashId === message.id ? "bg-amber-50 rounded-xl transition-colors" : ""}
          >
            {message.role === "user" ? (
              <UserMessage content={message.content} />
            ) : (
              <AIMessage
                content={stripCitationsBlock(message.content)}
                citations={message.citations}
                morphContent={message.morphContent}
                onOpenCitation={onOpenCitation}
              />
            )}
          </motion.div>
        ))}

        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isGeneratingExercise ? (
              <AIMessage content="" isStreaming>
                <ExerciseGeneratingIndicator />
              </AIMessage>
            ) : (
              <AIMessage
                content={stripCitationsBlock(streamingContent || "")}
                isStreaming
              />
            )}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end w-full">
      <div className="bg-[#1A1A1A] rounded-[20px_20px_6px_20px] px-4 py-3 max-w-[85%]">
        <p className="text-sm text-white leading-[1.7] whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}

function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1 align-middle">
      <span className="w-[5px] h-[5px] rounded-full bg-[#1A1A1A] animate-bounce [animation-delay:0ms]" />
      <span className="w-[5px] h-[5px] rounded-full bg-[#1A1A1A] animate-bounce [animation-delay:150ms]" />
      <span className="w-[5px] h-[5px] rounded-full bg-[#1A1A1A] animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

function AIMessage({
  content,
  citations,
  morphContent,
  isStreaming,
  onOpenCitation,
  children,
}: {
  content: string;
  citations?: Citation[];
  morphContent?: ReactNode;
  isStreaming?: boolean;
  onOpenCitation?: (citation: Citation) => void;
  children?: ReactNode;
}) {
  const [citationsOpen, setCitationsOpen] = useState(false);

  return (
    <div className="flex gap-3 w-full">
      <div className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[#1A1A1A] shrink-0 mt-0.5">
        <DiscentiaLogo size={16} className="text-white" alt="Discentia" />
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="px-1">
          {content && !morphContent ? (
            isStreaming ? (
              <MarkdownRenderer content={content} />
            ) : hasOpenUIContent(content) ? (
              <Renderer
                response={content}
                library={openuiLibrary}
                isStreaming={false}
              />
            ) : (
              <MarkdownRenderer content={content} />
            )
          ) : !morphContent && isStreaming ? (
            <div className="py-2">
              <StreamingIndicator />
            </div>
          ) : null}
          {isStreaming && content && !morphContent && (
            <span className="inline-block w-[3px] h-[18px] bg-[#1A1A1A] ml-0.5 animate-pulse align-middle rounded-full" />
          )}
        </div>

        {Boolean(citations?.length) && (
          <CitationsPanel
            citations={citations!}
            open={citationsOpen}
            onToggle={() => setCitationsOpen((o) => !o)}
            onOpenCitation={onOpenCitation}
          />
        )}
        {morphContent}
        {children}
      </div>
    </div>
  );
}

// ── Citation indicator + expandable panel ─────────────────────────────────────

function CitationsPanel({
  citations,
  open,
  onToggle,
  onOpenCitation,
}: {
  citations: Citation[];
  open: boolean;
  onToggle: () => void;
  onOpenCitation?: (citation: Citation) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Pill — collapsed trigger */}
      <button
        onClick={onToggle}
        className="self-start flex items-center gap-1.5 bg-[#F3F4F6] rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-[#E9EAEC] transition-colors"
      >
        <BookOpen size={14} className="text-[#6B7280] shrink-0" />
        <span className="text-[12px] font-medium text-[#6B7280]">
          {citations.length} source{citations.length !== 1 ? "s" : ""} used
        </span>
      </button>

      {/* Expanded panel */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex flex-col gap-3 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] p-4"
        >
          {/* Panel header */}
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#6B7280] shrink-0" />
            <span className="text-[13px] font-semibold text-[#6B7280]">
              Sources from your library
            </span>
          </div>

          {/* Source cards */}
          {citations.map((citation, i) => (
            <div
              key={`${citation.libraryItemId}-${i}`}
              className="flex items-center gap-3 bg-white rounded-lg border border-[#E5E7EB] p-3"
            >
              {/* Left accent bar */}
              <div className="w-[3px] h-10 rounded-sm bg-[#34D399] shrink-0" />

              {/* Content */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-[#171717] leading-tight truncate">
                  {citation.itemTitle}
                  {citation.page != null && (
                    <span className="ml-1.5 font-normal text-[#9CA3AF]">p. {citation.page}</span>
                  )}
                </span>
                {citation.excerpt && (
                  <span className="text-[12px] text-[#9CA3AF] leading-snug line-clamp-2">
                    &ldquo;{citation.excerpt}&rdquo;
                  </span>
                )}
              </div>

              {/* View link */}
              <button
                onClick={() => onOpenCitation?.(citation)}
                className="shrink-0 text-[12px] font-medium text-[#171717] hover:text-[#6B7280] transition-colors cursor-pointer"
              >
                View →
              </button>
            </div>
          ))}

          {/* Collapse button */}
          <button
            onClick={onToggle}
            className="flex items-center justify-center cursor-pointer hover:text-[#6B7280] transition-colors"
          >
            <span className="text-[12px] font-medium text-[#9CA3AF]">Collapse ↑</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
