"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  Clock,
  Zap,
  Swords,
} from "lucide-react";
import { useAppStore, type ActiveView } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import type { Conversation } from "@/types/chat";

const navItems: { id: ActiveView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "editor", label: "Editor", icon: Pencil },
];

export default function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed, setCommandPaletteOpen, setSettingsOpen } =
    useAppStore();
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);

  useEffect(() => {
    StorageService.listConversations().then((convos) => {
      setRecentChats(convos.slice(0, 3));
    });
  }, [activeView]);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 240 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="hidden md:flex flex-col h-screen shrink-0 border-r border-[#F3F4F6] bg-white relative select-none overflow-hidden"
    >
      {/* Logo area */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0">
        <div className="w-8 h-8 bg-[#171717] rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">d</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold text-[#0a0a0a] whitespace-nowrap">
            discentia
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-3.5 right-2 w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] text-[#9CA3AF] cursor-pointer transition-colors z-10"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <div className="flex flex-col gap-0.5 px-2 mt-2">
        {!sidebarCollapsed && (
          <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider px-2 mb-1">
            Navigation
          </span>
        )}
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-3 rounded-md cursor-pointer transition-colors ${
                sidebarCollapsed ? "justify-center px-0 py-2" : "px-3 py-2"
              } ${
                isActive
                  ? "bg-[#F3F4F6] font-medium text-[#0a0a0a]"
                  : "text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Recent Chats */}
      {!sidebarCollapsed && recentChats.length > 0 && (
        <div className="flex flex-col gap-0.5 px-2 mt-5">
          <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider px-2 mb-1">
            Recent Chats
          </span>
          {recentChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setActiveView("chat");
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[#6B7280] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
            >
              <Clock size={14} className="shrink-0 text-[#9CA3AF]" />
              <span className="text-sm truncate">{chat.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Exercises — placeholder icons */}
      {!sidebarCollapsed && (
        <div className="flex flex-col gap-0.5 px-2 mt-5">
          <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider px-2 mb-1">
            Recent Exercises
          </span>
          {/* Placeholder — will be populated from Dexie in Phase 2 */}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className={`flex items-center gap-2.5 rounded-md cursor-pointer hover:bg-[#F9FAFB] text-[#6B7280] transition-colors ${
            sidebarCollapsed ? "justify-center px-0 py-2" : "px-3 py-2"
          }`}
          title={sidebarCollapsed ? "Search ⌘K" : undefined}
        >
          <Search size={18} className="shrink-0" />
          {!sidebarCollapsed && (
            <span className="text-sm whitespace-nowrap">
              Search{" "}
              <kbd className="text-[10px] font-medium text-[#9CA3AF] ml-1">
                ⌘K
              </kbd>
            </span>
          )}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className={`flex items-center gap-2.5 rounded-md cursor-pointer hover:bg-[#F9FAFB] text-[#6B7280] transition-colors ${
            sidebarCollapsed ? "justify-center px-0 py-2" : "px-3 py-2"
          }`}
          title={sidebarCollapsed ? "Settings" : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!sidebarCollapsed && (
            <span className="text-sm whitespace-nowrap">Settings</span>
          )}
        </button>
      </div>

      {/* User */}
      <div
        className={`flex items-center gap-2.5 px-3 py-3 border-t border-[#F3F4F6] ${
          sidebarCollapsed ? "justify-center" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-[#6B7280]">U</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-medium text-[#0a0a0a] truncate">
            User Name
          </span>
        )}
      </div>
    </motion.aside>
  );
}
