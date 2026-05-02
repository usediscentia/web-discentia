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
  settingsOpen: boolean;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  libraryFocusItemId: string | null;
  editorItemId: string | null;
  studyFilterItemId: string | null;
  setStudyFilterItemId: (id: string | null) => void;
  setActiveView: (view: ActiveView) => void;
  setSettingsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLibraryFocusItemId: (id: string | null) => void;
  setEditorItemId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "study",
  settingsOpen: false,
  commandPaletteOpen: false,
  sidebarCollapsed:
    typeof window !== "undefined"
      ? localStorage.getItem("discentia_sidebar_collapsed") === "1"
      : false,
  libraryFocusItemId: null,
  editorItemId: null,
  studyFilterItemId: null,
  setActiveView: (view) => set({ activeView: view }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
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
}));
