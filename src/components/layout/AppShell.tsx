"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Layers, Settings, Sparkles } from "lucide-react"
import { useAppStore } from "@/stores/app.store"
import { useDialogStore } from "@/stores/dialog.store"
import { useProviderStore } from "@/stores/provider.store"
import Sidebar from "@/components/layout/Sidebar"
import AppearanceEffects from "@/components/layout/AppearanceEffects"
import DecksView from "@/components/decks/DecksView"
import DeckDetailPage from "@/components/decks/DeckDetailPage"
import StudyView from "@/components/study/StudyView"
import { SettingsModal } from "@/components/providers/SettingsModal"
import { CommandPalette } from "@/components/search/CommandPalette"
import OnboardingFlow from "@/components/onboarding/OnboardingFlow"
import GenerationModal from "@/components/generation/GenerationModal"

function MobileNav() {
  const { activeView, setActiveView } = useAppStore()
  const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen)

  const items = [
    { id: "study" as const, label: "Estudar", icon: Sparkles },
    { id: "decks" as const, label: "Decks", icon: Layers },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-3 px-2 py-2">
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
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] text-muted-foreground transition-colors"
        >
          <Settings size={18} />
          <span>Ajustes</span>
        </button>
      </div>
    </nav>
  )
}

export default function AppShell() {
  const { activeView, selectedDeckId, setCommandPaletteOpen } = useAppStore()
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView === "decks" ? `decks-${selectedDeckId ?? "grid"}` : activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {activeView === "decks" &&
                (selectedDeckId ? (
                  <DeckDetailPage deckId={selectedDeckId} />
                ) : (
                  <DecksView />
                ))}
              {activeView === "study" && <StudyView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <GenerationModal />
      <SettingsModal />
    </>
  )
}
