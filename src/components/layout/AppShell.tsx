"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app.store";
import { useProviderStore } from "@/stores/provider.store";
import Sidebar from "@/components/layout/Sidebar";
import ChatView from "@/components/chat/ChatView";
import LibraryView from "@/components/library/LibraryView";
import SettingsPage from "@/components/providers/SettingsPage";

export default function AppShell() {
  const { activeView } = useAppStore();
  const { loadProviderConfigs } = useProviderStore();

  useEffect(() => {
    loadProviderConfigs();
  }, [loadProviderConfigs]);

  return (
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
        {activeView === "editor" && (
          <div className="flex items-center justify-center h-full text-[#9CA3AF] text-sm">
            Editor — Phase 3
          </div>
        )}
        {activeView === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
