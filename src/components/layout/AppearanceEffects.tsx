"use client";

import { useEffect } from "react";
import { useAppearanceStore } from "@/stores/appearance.store";

export default function AppearanceEffects() {
  const hydrateAppearance = useAppearanceStore((state) => state.hydrateAppearance);
  const syncSystemTheme = useAppearanceStore((state) => state.syncSystemTheme);

  useEffect(() => {
    hydrateAppearance();
  }, [hydrateAppearance]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      syncSystemTheme();
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [syncSystemTheme]);

  return null;
}
