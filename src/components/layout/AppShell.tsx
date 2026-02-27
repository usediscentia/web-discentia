"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app.store";
import { useProviderStore } from "@/stores/provider.store";
import Sidebar from "@/components/layout/Sidebar";
import ChatView from "@/components/chat/ChatView";
import LibraryView from "@/components/library/LibraryView";
import SettingsPage from "@/components/providers/SettingsPage";
import EditorView from "@/components/editor/EditorView";
import ReviewView from "@/components/review/ReviewView";
import DashboardView from "@/components/dashboard/DashboardView";
import OnboardingFlow, {
  ONBOARDED_KEY,
} from "@/components/onboarding/OnboardingFlow";
import { CommandPalette } from "@/components/search/CommandPalette";

export default function AppShell() {
  const { activeView, setCommandPaletteOpen } = useAppStore();
  const { loadProviderConfigs } = useProviderStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    loadProviderConfigs();
  }, [loadProviderConfigs]);

  // Check if user has completed onboarding
  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDED_KEY);
    if (!onboarded) {
      setShowOnboarding(true);
    }
    setCheckDone(true);
  }, []);

  // Global ⌘K / Ctrl+K shortcut opens CommandPalette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandPaletteOpen]);

  // Don't render anything until we've checked onboarding status
  if (!checkDone) return null;

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}
      <CommandPalette />
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          {activeView === "chat" && <ChatView />}
          {activeView === "library" && <LibraryView />}
          {activeView === "dashboard" && <DashboardView />}
          {activeView === "editor" && <EditorView />}
          {activeView === "review" && <ReviewView />}
          {activeView === "settings" && <SettingsPage />}
        </main>
      </div>
    </>
  );
}
