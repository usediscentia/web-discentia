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
  setActiveView: (view: ActiveView) => void;
  setSettingsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "chat",
  settingsOpen: false,
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  setActiveView: (view) => set({ activeView: view }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
