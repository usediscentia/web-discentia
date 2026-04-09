"use client"

import { useEffect, useState } from "react"
import { BookOpen, MessageSquare, Settings, Sparkles, BarChart2 } from "lucide-react"
import { useAppStore } from "@/stores/app.store"
import { useProviderStore } from "@/stores/provider.store"
import Sidebar from "@/components/layout/Sidebar"
import AppearanceEffects from "@/components/layout/AppearanceEffects"
import ChatView from "@/components/chat/ChatView"
import LibraryView from "@/components/library/LibraryView"
import SettingsPage from "@/components/providers/SettingsPage"
import EditorView from "@/components/editor/EditorView"
import StudyView from "@/components/study/StudyView"
import StatsView from "@/components/stats/StatsView"
import { CommandPalette } from "@/components/search/CommandPalette"
import OnboardingFlow from "@/components/onboarding/OnboardingFlow"

function MobileNav() {
  const { activeView, setActiveView } = useAppStore()

  const items = [
    { id: "study" as const, label: "Estudar", icon: Sparkles },
    { id: "library" as const, label: "Biblioteca", icon: BookOpen },
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "stats" as const, label: "Stats", icon: BarChart2 },
    { id: "settings" as const, label: "Ajustes", icon: Settings },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-colors ${
                isActive
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function AppShell() {
  const { activeView, setCommandPaletteOpen } = useAppStore()
  const { loadProviderConfigs } = useProviderStore()
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("discentia_onboarded") !== "1"
  })

  useEffect(() => {
    void loadProviderConfigs()
  }, [loadProviderConfigs])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setCommandPaletteOpen])

  return (
    <>
      <AppearanceEffects />
      <CommandPalette />
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden pb-[76px] md:pb-0">
          {activeView === "chat" && <ChatView />}
          {activeView === "library" && <LibraryView />}
          {activeView === "editor" && <EditorView />}
          {activeView === "study" && <StudyView />}
          {activeView === "settings" && <SettingsPage />}
          {activeView === "stats" && <StatsView />}
        </main>
      </div>
      <MobileNav />
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
    </>
  )
}
