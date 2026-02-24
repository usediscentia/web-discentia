"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app.store";
import { useProviderStore } from "@/stores/provider.store";
import Sidebar from "@/components/layout/Sidebar";
import ChatView from "@/components/chat/ChatView";
import LibraryView from "@/components/library/LibraryView";
import SettingsPage from "@/components/providers/SettingsPage";
import EditorView from "@/components/editor/EditorView";
import OnboardingFlow, {
  ONBOARDED_KEY,
} from "@/components/onboarding/OnboardingFlow";

export default function AppShell() {
  const { activeView } = useAppStore();
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

  // Don't render anything until we've checked onboarding status
  if (!checkDone) return null;

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          {activeView === "chat" && <ChatView />}
          {activeView === "library" && <LibraryView />}
          {activeView === "dashboard" && (
            <div className="flex items-center justify-center h-full text-[#9CA3AF] text-sm">
              Dashboard — Phase 3
            </div>
          )}
          {activeView === "editor" && <EditorView />}
          {activeView === "settings" && <SettingsPage />}
        </main>
      </div>
    </>
  );
}
