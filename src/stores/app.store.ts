import { create } from "zustand";

export type ActiveView =
  | "chat"
  | "library"
  | "dashboard"
  | "editor"
  | "settings";

interface AppState {
  activeView: ActiveView;
  settingsOpen: boolean;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  libraryFocusItemId: string | null;
  editorItemId: string | null;
  setActiveView: (view: ActiveView) => void;
  setSettingsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLibraryFocusItemId: (id: string | null) => void;
  setEditorItemId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "chat",
  settingsOpen: false,
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  libraryFocusItemId: null,
  editorItemId: null,
  setActiveView: (view) => set({ activeView: view }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setLibraryFocusItemId: (id) => set({ libraryFocusItemId: id }),
  setEditorItemId: (id) => set({ editorItemId: id }),
}));
