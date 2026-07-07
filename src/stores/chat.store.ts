import { create } from "zustand";
import type { Message } from "@/types/chat";

interface ChatState {
  activeConversationId: string | null;
  isStreaming: boolean;
  messages: Message[];
  selectedDeckId: string | null;
  pendingMessage: string | null;
  searchHighlight: { term: string; messageId: string } | null;
  setActiveConversationId: (id: string | null) => void;
  setIsStreaming: (streaming: boolean) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  clearMessages: () => void;
  setSelectedDeckId: (id: string | null) => void;
  clearDeck: () => void;
  setPendingMessage: (msg: string | null) => void;
  setSearchHighlight: (highlight: { term: string; messageId: string } | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  isStreaming: false,
  messages: [],
  selectedDeckId: null,
  pendingMessage: null,
  searchHighlight: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setSelectedDeckId: (id) => set({ selectedDeckId: id }),
  clearDeck: () => set({ selectedDeckId: null }),
  setPendingMessage: (msg) => set({ pendingMessage: msg }),
  setSearchHighlight: (highlight) => set({ searchHighlight: highlight }),
}));
