"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import { ReactNode } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  morphContent?: ReactNode;
}

interface ChatMessagesProps {
  messages: Message[];
  streamingContent?: string;
  isStreaming?: boolean;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col items-center flex-1 overflow-y-auto w-full px-0 py-6">
      <div className="flex flex-col gap-5 w-[720px]">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {message.role === "user" ? (
              <UserMessage content={message.content} />
            ) : (
              <AIMessage
                content={message.content}
                morphContent={message.morphContent}
              />
            )}
          </motion.div>
        ))}

        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
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
      <div className="bg-[#1A1A1A] rounded-[18px_18px_4px_18px] px-4 py-3">
        <p className="text-sm text-white leading-6 whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}

function AIMessage({
  content,
  morphContent,
  isStreaming,
}: {
  content: string;
  morphContent?: ReactNode;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex gap-3 w-full">
      <div className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[#1A1A1A] shrink-0">
        <AcademicCapIcon className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="bg-transparent rounded-[18px_18px_18px_4px] px-4 py-3">
          <div className="text-sm text-[#1A1A1A] leading-6 prose prose-sm max-w-none prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-code:text-[#1A1A1A] prose-code:bg-[#F3F4F6] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-[#1A1A1A] ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        </div>
        {morphContent}
      </div>
    </div>
  );
}
