"use client";

import { create } from "zustand";
import {
  type AppearancePreferences,
  type FontSizeOption,
  type ResolvedTheme,
  type ThemeOption,
  DEFAULT_APPEARANCE_PREFERENCES,
  applyAppearanceToDocument,
  getStoredAppearancePreferences,
  persistAppearancePreferences,
  resolveTheme,
} from "@/lib/appearance";

interface AppearanceState extends AppearancePreferences {
  resolvedTheme: ResolvedTheme;
  hydrated: boolean;
  hydrateAppearance: () => void;
  setTheme: (theme: ThemeOption) => void;
  setAccentColor: (accentColor: string) => void;
  setFontSize: (fontSize: FontSizeOption) => void;
  syncSystemTheme: () => void;
}

function applyAndPersist(preferences: AppearancePreferences) {
  persistAppearancePreferences(preferences);
  return applyAppearanceToDocument(preferences);
}

const initialPreferences =
  typeof window !== "undefined"
    ? getStoredAppearancePreferences()
    : DEFAULT_APPEARANCE_PREFERENCES;

export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  ...initialPreferences,
  resolvedTheme:
    typeof window !== "undefined"
      ? resolveTheme(initialPreferences.theme)
      : "light",
  hydrated: typeof window !== "undefined",
  hydrateAppearance: () => {
    const preferences = getStoredAppearancePreferences();
    const resolvedTheme = applyAppearanceToDocument(preferences);

    set({
      ...preferences,
      resolvedTheme,
      hydrated: true,
    });
  },
  setTheme: (theme) => {
    const state = get();
    const preferences = {
      theme,
      accentColor: state.accentColor,
      fontSize: state.fontSize,
    };
    const resolvedTheme = applyAndPersist(preferences);

    set({
      theme,
      resolvedTheme,
      hydrated: true,
    });
  },
  setAccentColor: (accentColor) => {
    const state = get();
    const preferences = {
      theme: state.theme,
      accentColor,
      fontSize: state.fontSize,
    };
    const resolvedTheme = applyAndPersist(preferences);

    set({
      accentColor: preferences.accentColor,
      resolvedTheme,
      hydrated: true,
    });
  },
  setFontSize: (fontSize) => {
    const state = get();
    const preferences = {
      theme: state.theme,
      accentColor: state.accentColor,
      fontSize,
    };
    const resolvedTheme = applyAndPersist(preferences);

    set({
      fontSize,
      resolvedTheme,
      hydrated: true,
    });
  },
  syncSystemTheme: () => {
    const state = get();
    if (state.theme !== "system") return;

    const resolvedTheme = applyAppearanceToDocument({
      theme: state.theme,
      accentColor: state.accentColor,
      fontSize: state.fontSize,
    });

    if (resolvedTheme !== state.resolvedTheme) {
      set({ resolvedTheme });
    }
  },
}));
