"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TopNavbar } from "@/components/TopNavbar";
import { InputBar } from "@/components/InputBar";
import { ChatEmpty } from "@/components/ChatEmpty";
import { ChatMessages, type Message as ViewMessage } from "@/components/ChatMessages";
import { LibraryEmpty } from "@/components/LibraryEmpty";
import { LibraryPopulated } from "@/components/LibraryPopulated";
import { AIProviderSelector } from "@/components/AIProviderSelector";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useChat } from "@/hooks/useChat";
import { useAppStore } from "@/stores/app.store";

type LibraryView = "empty" | "populated";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "library">("chat");
  const [libraryView, setLibraryView] = useState<LibraryView>("populated");
  const [aiSelectorOpen, setAiSelectorOpen] = useState(false);

  const { loadProviderConfigs } = useAppStore();
  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    startNewConversation,
  } = useChat();

  useEffect(() => {
    loadProviderConfigs();
  }, [loadProviderConfigs]);

  // Map persistence messages to view messages
  const viewMessages: ViewMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  const hasMessages = viewMessages.length > 0;

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleTabChange = (tab: "chat" | "library") => {
    setActiveTab(tab);
    if (tab === "chat") {
      // Reset to fresh chat when switching back
    }
  };

  const libraryViews: { label: string; view: LibraryView }[] = [
    { label: "Empty", view: "empty" },
    { label: "Populated", view: "populated" },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA]">
      <TopNavbar activeTab={activeTab} onTabChange={handleTabChange} />

      <AnimatePresence mode="wait">
        {activeTab === "chat" ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 min-h-0"
          >
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
          </motion.div>
        ) : (
          <motion.div
            key={`library-${libraryView}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Library demo selector */}
            <div className="flex items-center gap-2 px-8 py-2 border-b border-[#F3F4F6] bg-white/80 backdrop-blur-sm">
              <span className="text-[11px] font-medium text-[#9CA3AF] mr-2 uppercase tracking-wider">
                Demo:
              </span>
              {libraryViews.map((v) => (
                <button
                  key={v.view}
                  onClick={() => setLibraryView(v.view)}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    libraryView === v.view
                      ? "bg-[#1A1A1A] text-white"
                      : "text-[#6B7280] hover:bg-[#F3F4F6]"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {libraryView === "empty" ? (
              <LibraryEmpty />
            ) : (
              <LibraryPopulated />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsDialog />
    </div>
  );
}
