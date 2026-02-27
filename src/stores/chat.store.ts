import { create } from "zustand";
import type { Message } from "@/types/chat";

interface ChatState {
  activeConversationId: string | null;
  isStreaming: boolean;
  messages: Message[];
  selectedLibraryIds: string[];
  pendingMessage: string | null;
  searchHighlight: { term: string; messageId: string } | null;
  setActiveConversationId: (id: string | null) => void;
  setIsStreaming: (streaming: boolean) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  clearMessages: () => void;
  setSelectedLibraryIds: (ids: string[]) => void;
  toggleLibrary: (id: string) => void;
  clearLibraries: () => void;
  setPendingMessage: (msg: string | null) => void;
  setSearchHighlight: (highlight: { term: string; messageId: string } | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  isStreaming: false,
  messages: [],
  selectedLibraryIds: [],
  pendingMessage: null,
  searchHighlight: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setSelectedLibraryIds: (ids) => set({ selectedLibraryIds: ids }),
  toggleLibrary: (id) =>
    set((state) => ({
      selectedLibraryIds: state.selectedLibraryIds.includes(id)
        ? state.selectedLibraryIds.filter((x) => x !== id)
        : [...state.selectedLibraryIds, id],
    })),
  clearLibraries: () => set({ selectedLibraryIds: [] }),
  setPendingMessage: (msg) => set({ pendingMessage: msg }),
  setSearchHighlight: (highlight) => set({ searchHighlight: highlight }),
}));
