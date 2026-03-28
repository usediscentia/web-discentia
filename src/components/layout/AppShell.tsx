"use client"

import { useEffect } from "react"
import { useAppStore } from "@/stores/app.store"
import { useProviderStore } from "@/stores/provider.store"
import { useAuthStore } from "@/stores/auth.store"
import { sendBackup } from "@/lib/backup"
import Sidebar from "@/components/layout/Sidebar"
import ChatView from "@/components/chat/ChatView"
import LibraryView from "@/components/library/LibraryView"
import SettingsPage from "@/components/providers/SettingsPage"
import EditorView from "@/components/editor/EditorView"
import ReviewView from "@/components/review/ReviewView"
import StudyView from "@/components/study/StudyView"
import DashboardView from "@/components/dashboard/DashboardView"
import StatsView from "@/components/stats/StatsView"
import AuthScreen from "@/components/auth/AuthScreen"
import { CommandPalette } from "@/components/search/CommandPalette"

export default function AppShell() {
  const { activeView, setCommandPaletteOpen } = useAppStore()
  const { loadProviderConfigs } = useProviderStore()
  const { user, isLoading, checkSession } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    if (user) {
      loadProviderConfigs()
      sendBackup().catch(console.error) // fire-and-forget, non-fatal
    }
  }, [user, loadProviderConfigs])

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

  if (isLoading) return null

  if (!user) return <AuthScreen />

  return (
    <>
      <CommandPalette />
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          {activeView === "chat" && <ChatView />}
          {activeView === "library" && <LibraryView />}
          {activeView === "dashboard" && <DashboardView />}
          {activeView === "editor" && <EditorView />}
          {activeView === "review" && <ReviewView />}
          {activeView === "study" && <StudyView />}
          {activeView === "settings" && <SettingsPage />}
          {activeView === "stats" && <StatsView />}
        </main>
      </div>
    </>
  )
}
