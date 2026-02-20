"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import type { Citation } from "@/types/chat";
import { Button } from "@/components/ui/button";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  morphContent?: ReactNode;
}

interface ChatMessagesProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
  onOpenCitation?: (citation: Citation) => void;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
  onOpenCitation,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

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
      setIsNearBottom(true);
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={scrollRef}
      className="flex flex-col items-center flex-1 overflow-y-auto w-full px-0 py-6"
    >
      <div className="flex flex-col gap-5 w-full max-w-[720px] px-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
          >
            {message.role === "user" ? (
              <UserMessage content={message.content} />
            ) : (
              <AIMessage
                content={message.content}
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
            <AIMessage
              content={streamingContent || ""}
              isStreaming
            />
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
}: {
  content: string;
  citations?: Citation[];
  morphContent?: ReactNode;
  isStreaming?: boolean;
  onOpenCitation?: (citation: Citation) => void;
}) {
  const [citationsOpen, setCitationsOpen] = useState(false);

  return (
    <div className="flex gap-3 w-full">
      <div className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[#1A1A1A] shrink-0 mt-0.5">
        <GraduationCap size={16} className="text-white" />
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="px-1">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : isStreaming ? (
            <div className="py-2">
              <StreamingIndicator />
            </div>
          ) : null}
          {isStreaming && content && (
            <span className="inline-block w-[3px] h-[18px] bg-[#1A1A1A] ml-0.5 animate-pulse align-middle rounded-full" />
          )}
        </div>

        {Boolean(citations?.length) && (
          <div className="px-1">
            <button
              onClick={() => setCitationsOpen((open) => !open)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-[#444] cursor-pointer hover:bg-[#F8F8F8] transition-colors flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {citations?.length} source{citations && citations.length > 1 ? "s" : ""} from your library
            </button>

            {citationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-2 rounded-xl border border-[#EAEAEA] bg-white p-3 space-y-2 shadow-sm"
              >
                {citations?.map((citation) => (
                  <div
                    key={`${citation.libraryItemId}-${citation.excerpt}`}
                    className="flex items-start justify-between gap-3 border-b border-[#F2F2F2] pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A1A]">
                        {citation.itemTitle}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">
                        {citation.excerpt}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="cursor-pointer h-7 px-2.5 text-xs shrink-0"
                      onClick={() => onOpenCitation?.(citation)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
        {morphContent}
      </div>
    </div>
  );
}
