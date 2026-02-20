"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, PencilLine, Search, Trash2 } from "lucide-react";
import { ChatEmpty } from "@/components/chat/ChatEmpty";
import { ChatMessages, type Message as ViewMessage } from "@/components/chat/ChatMessages";
import { InputBar } from "@/components/chat/InputBar";
import { AIProviderSelector } from "@/components/providers/AIProviderSelector";
import { SettingsDialog } from "@/components/providers/SettingsDialog";
import { useChat } from "@/hooks/useChat";
import { useAppStore } from "@/stores/app.store";
import type { Citation } from "@/types/chat";
import { StorageService } from "@/services/storage";

export default function ChatView() {
  const [aiSelectorOpen, setAiSelectorOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("New conversation");
  const { setActiveView, setLibraryFocusItemId } = useAppStore();

  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    startNewConversation,
    availableLibraries,
    selectedLibraryIds,
    toggleLibrary,
    activeConversationId,
  } = useChat();

  const viewMessages: ViewMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    citations: m.citations,
  }));

  const hasMessages = viewMessages.length > 0;
  const canManageConversation = Boolean(activeConversationId);

  useEffect(() => {
    let cancelled = false;
    if (!activeConversationId) {
      const timeout = window.setTimeout(() => {
        if (!cancelled) setConversationTitle("New conversation");
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timeout);
      };
    }

    const timeout = window.setTimeout(() => {
      StorageService.getConversation(activeConversationId).then((conversation) => {
        if (cancelled) return;
        setConversationTitle(conversation?.title || "Conversation");
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeConversationId, messages.length]);

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleOpenCitation = (citation: Citation) => {
    setLibraryFocusItemId(citation.libraryItemId);
    setActiveView("library");
  };

  const handleRenameConversation = async () => {
    if (!activeConversationId) return;
    const nextTitle = window.prompt("Rename conversation", conversationTitle);
    if (!nextTitle || !nextTitle.trim()) return;
    await StorageService.updateConversation(activeConversationId, {
      title: nextTitle.trim(),
      updatedAt: Date.now(),
    });
    setConversationTitle(nextTitle.trim());
  };

  const handleDeleteConversation = async () => {
    if (!activeConversationId) return;
    const confirmed = window.confirm(`Delete "${conversationTitle}"?`);
    if (!confirmed) return;
    await StorageService.deleteConversation(activeConversationId);
    startNewConversation();
  };

  const handleExportConversation = async () => {
    const transcript = messages
      .map((message) => {
        const role = message.role === "assistant" ? "AI" : "User";
        return `${role}: ${message.content}`;
      })
      .join("\n\n");

    const header = `# ${conversationTitle}\n\n`;
    const payload = `${header}${transcript}`;

    try {
      await navigator.clipboard.writeText(payload);
      alert("Conversation copied to clipboard");
    } catch {
      alert("Could not copy conversation");
    }
  };

  const providerLabel = useMemo(() => {
    return selectedLibraryIds.length > 0
      ? `${selectedLibraryIds.length} libraries selected`
      : "No libraries selected";
  }, [selectedLibraryIds.length]);

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA]">
      <div className="px-8 py-4 border-b border-[#ECECEC] bg-white flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#1A1A1A] truncate">
            {conversationTitle}
          </h2>
          <p className="text-xs text-[#888] mt-0.5">{providerLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewConversation}
            className="text-xs text-[#666] px-3 py-1.5 border border-[#DDD] rounded-full cursor-pointer hover:bg-white"
          >
            New
          </button>
          <button
            className="w-8 h-8 rounded-md border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center"
            title="Search in conversation (coming soon)"
            disabled
          >
            <Search size={14} />
          </button>
          <button
            onClick={handleExportConversation}
            className="w-8 h-8 rounded-md border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center cursor-pointer hover:bg-[#F8F8F8]"
            title="Export conversation"
            disabled={!messages.length}
          >
            <Download size={14} />
          </button>
          <button
            onClick={handleRenameConversation}
            className="w-8 h-8 rounded-md border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center cursor-pointer hover:bg-[#F8F8F8]"
            title="Rename conversation"
            disabled={!canManageConversation}
          >
            <PencilLine size={14} />
          </button>
          <button
            onClick={handleDeleteConversation}
            className="w-8 h-8 rounded-md border border-[#FAD0D0] text-[#DC2626] flex items-center justify-center cursor-pointer hover:bg-[#FFF5F5]"
            title="Delete conversation"
            disabled={!canManageConversation}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {!hasMessages && !isStreaming ? (
        <ChatEmpty onPromptClick={handlePromptClick} />
      ) : (
        <ChatMessages
          messages={viewMessages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          onOpenCitation={handleOpenCitation}
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
          libraries={availableLibraries}
          selectedLibraryIds={selectedLibraryIds}
          onToggleLibrary={toggleLibrary}
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
