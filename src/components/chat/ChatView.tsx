"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChatEmpty } from "@/components/chat/ChatEmpty";
import { ChatMessages, type Message as ViewMessage } from "@/components/chat/ChatMessages";
import { InputBar } from "@/components/chat/InputBar";
import { AIProviderSelector } from "@/components/providers/AIProviderSelector";
import { SettingsDialog } from "@/components/providers/SettingsDialog";
import { useChat } from "@/hooks/useChat";

export default function ChatView() {
  const [aiSelectorOpen, setAiSelectorOpen] = useState(false);

  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    startNewConversation,
  } = useChat();

  const viewMessages: ViewMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  const hasMessages = viewMessages.length > 0;

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA]">
      {!hasMessages && !isStreaming ? (
        <ChatEmpty onPromptClick={handlePromptClick} />
      ) : (
        <ChatMessages
          messages={viewMessages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
        />
      )}

      {error && (
        <div className="flex justify-center px-8 pb-2">
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </p>
        </div>
      )}

      <div className="relative">
        <InputBar
          onSend={sendMessage}
          onStop={stopStreaming}
          disabled={isStreaming}
          isStreaming={isStreaming}
          onAIProviderClick={() => setAiSelectorOpen(!aiSelectorOpen)}
        />
        <AIProviderSelector
          isOpen={aiSelectorOpen}
          onClose={() => setAiSelectorOpen(false)}
        />
      </div>

      <SettingsDialog />
    </div>
  );
}
