import { create } from "zustand";

export type ActiveView = "decks" | "study";

interface AppState {
  activeView: ActiveView;
  selectedDeckId: string | null;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  libraryFocusItemId: string | null;
  editorItemId: string | null;
  studyFilterItemId: string | null;
  activeLibraryId: string | null;
  setActiveView: (view: ActiveView) => void;
  openDeck: (id: string) => void;
  closeDeck: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLibraryFocusItemId: (id: string | null) => void;
  setEditorItemId: (id: string | null) => void;
  setStudyFilterItemId: (id: string | null) => void;
  setActiveLibraryId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "decks",
  selectedDeckId: null,
  commandPaletteOpen: false,
  sidebarCollapsed:
    typeof window !== "undefined"
      ? localStorage.getItem("discentia_sidebar_collapsed") === "1"
      : false,
  libraryFocusItemId: null,
  editorItemId: null,
  studyFilterItemId: null,
  activeLibraryId: null,
  setActiveView: (view) => set({ activeView: view, selectedDeckId: null }),
  openDeck: (id) => set({ activeView: "decks", selectedDeckId: id }),
  closeDeck: () => set({ selectedDeckId: null }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("discentia_sidebar_collapsed", collapsed ? "1" : "0");
    }
    set({ sidebarCollapsed: collapsed });
  },
  setLibraryFocusItemId: (id) => set({ libraryFocusItemId: id }),
  setEditorItemId: (id) => set({ editorItemId: id }),
  setStudyFilterItemId: (id) => set({ studyFilterItemId: id }),
  setActiveLibraryId: (id) => set({ activeLibraryId: id }),
}));
