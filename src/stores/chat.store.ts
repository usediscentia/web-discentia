import { create } from "zustand";

interface ChatState {
  activeConversationId: string | null;
  isStreaming: boolean;
  selectedLibraryIds: string[];
  setActiveConversationId: (id: string | null) => void;
  setIsStreaming: (streaming: boolean) => void;
  toggleLibrary: (id: string) => void;
  clearLibraries: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  isStreaming: false,
  selectedLibraryIds: [],
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  toggleLibrary: (id) =>
    set((state) => ({
      selectedLibraryIds: state.selectedLibraryIds.includes(id)
        ? state.selectedLibraryIds.filter((x) => x !== id)
        : [...state.selectedLibraryIds, id],
    })),
  clearLibraries: () => set({ selectedLibraryIds: [] }),
}));
