import { create } from "zustand";

export type ActiveView =
  | "chat"
  | "library"
  | "editor"
  | "settings"
  | "study"
  | "stats";

interface AppState {
  activeView: ActiveView;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  libraryFocusItemId: string | null;
  editorItemId: string | null;
  setActiveView: (view: ActiveView) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLibraryFocusItemId: (id: string | null) => void;
  setEditorItemId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "study",
  commandPaletteOpen: false,
  sidebarCollapsed:
    typeof window !== "undefined"
      ? localStorage.getItem("discentia_sidebar_collapsed") === "1"
      : false,
  libraryFocusItemId: null,
  editorItemId: null,
  setActiveView: (view) => set({ activeView: view }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("discentia_sidebar_collapsed", collapsed ? "1" : "0");
    }
    set({ sidebarCollapsed: collapsed });
  },
  setLibraryFocusItemId: (id) => set({ libraryFocusItemId: id }),
  setEditorItemId: (id) => set({ editorItemId: id }),
}));
