"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Pencil,
  ChevronLeft,
  Search,
  Settings,
  Clock,
  Plus,
  PencilLine,
  Trash2,
} from "lucide-react";
import { useAppStore, type ActiveView } from "@/stores/app.store";
import { useChatStore } from "@/stores/chat.store";
import { StorageService } from "@/services/storage";
import type { Conversation } from "@/types/chat";

const navItems: {
  id: ActiveView;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "editor", label: "Editor", icon: Pencil },
];

const EXPANDED_W = 240;
const COLLAPSED_W = 56;

export default function Sidebar() {
  const {
    activeView,
    setActiveView,
    sidebarCollapsed,
    setSidebarCollapsed,
    setCommandPaletteOpen,
    setSettingsOpen,
  } = useAppStore();
  const { activeConversationId, setActiveConversationId, messages } =
    useChatStore();
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);

  const refreshChats = useCallback(() => {
    StorageService.listConversations().then((convos) => {
      setRecentChats(convos.slice(0, 8));
    });
  }, []);

  useEffect(() => {
    refreshChats();
  }, [activeView, activeConversationId, messages.length, refreshChats]);

  const handleRenameConversation = async (conversation: Conversation) => {
    const nextTitle = window.prompt("Rename conversation", conversation.title);
    if (!nextTitle || !nextTitle.trim()) return;
    await StorageService.updateConversation(conversation.id, {
      title: nextTitle.trim(),
      updatedAt: Date.now(),
    });
    refreshChats();
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    const confirmed = window.confirm(`Delete "${conversation.title}"?`);
    if (!confirmed) return;
    await StorageService.deleteConversation(conversation.id);
    if (activeConversationId === conversation.id) {
      setActiveConversationId(null);
    }
    refreshChats();
  };

  // Shared fade class — text/labels fade smoothly when collapsing
  const fade = `transition-opacity duration-200 ${
    sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
  }`;

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="hidden md:flex flex-col h-screen shrink-0 border-r border-[#F3F4F6] bg-white select-none overflow-hidden"
    >
      {/* Fixed-width inner — prevents reflow, lets overflow-hidden clip naturally */}
      <div className="flex flex-col h-full" style={{ width: EXPANDED_W }}>
        {/* Header */}
        <div className="flex items-center h-14 shrink-0 px-4">
          <motion.div
            className={`w-8 h-8 bg-[#171717] rounded-lg flex items-center justify-center shrink-0 ${
              sidebarCollapsed ? "cursor-pointer" : ""
            }`}
            onClick={
              sidebarCollapsed ? () => setSidebarCollapsed(false) : undefined
            }
            whileHover={sidebarCollapsed ? { scale: 1.08 } : {}}
            whileTap={sidebarCollapsed ? { scale: 0.92 } : {}}
            role={sidebarCollapsed ? "button" : undefined}
            tabIndex={sidebarCollapsed ? 0 : undefined}
            title={sidebarCollapsed ? "Expand sidebar" : undefined}
          >
            <span className="text-white text-sm font-bold select-none">d</span>
          </motion.div>

          <span
            className={`text-sm font-semibold text-[#0a0a0a] whitespace-nowrap ml-2.5 ${fade}`}
          >
            discentia
          </span>

          <div className="flex-1" />

          <button
            onClick={() => setSidebarCollapsed(true)}
            className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] text-[#9CA3AF] cursor-pointer transition-all duration-200 ${
              sidebarCollapsed
                ? "opacity-0 pointer-events-none scale-75"
                : "opacity-100 scale-100"
            }`}
            tabIndex={sidebarCollapsed ? -1 : 0}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-0.5 px-2 mt-2">
          <span
            className={`text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider px-2 mb-1 ${fade}`}
          >
            Navigation
          </span>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 rounded-md cursor-pointer transition-colors px-3 py-2 ${
                  isActive
                    ? "bg-[#F3F4F6] font-medium text-[#0a0a0a]"
                    : "text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                <span className={`text-sm whitespace-nowrap ${fade}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recent Chats */}
        <div
          className={`flex flex-col gap-0.5 px-2 mt-5 transition-opacity duration-200 ${
            sidebarCollapsed || recentChats.length === 0
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
        >
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
              Recent Chats
            </span>
            <button
              onClick={() => {
                setActiveConversationId(null);
                setActiveView("chat");
              }}
              className="text-[#9CA3AF] hover:text-[#555] transition-colors cursor-pointer"
              title="New conversation"
            >
              <Plus size={13} />
            </button>
          </div>
          {recentChats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 px-2 py-1.5 rounded-md ${
                activeConversationId === chat.id
                  ? "bg-[#F3F4F6]"
                  : "hover:bg-[#F9FAFB]"
              }`}
            >
              <button
                onClick={() => {
                  setActiveConversationId(chat.id);
                  setActiveView("chat");
                }}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer text-left"
                title={chat.title}
              >
                <Clock size={14} className="shrink-0 text-[#9CA3AF]" />
                <span className="text-sm truncate text-[#6B7280]">
                  {chat.title}
                </span>
              </button>
              <div className="hidden group-hover:flex items-center gap-1">
                <button
                  className="text-[#9CA3AF] hover:text-[#555] cursor-pointer"
                  onClick={() => handleRenameConversation(chat)}
                  title="Rename"
                >
                  <PencilLine size={12} />
                </button>
                <button
                  className="text-[#9CA3AF] hover:text-red-600 cursor-pointer"
                  onClick={() => handleDeleteConversation(chat)}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Exercises */}
        <div
          className={`flex flex-col gap-0.5 px-2 mt-5 transition-opacity duration-200 ${
            sidebarCollapsed
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
        >
          <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider px-2 mb-1">
            Recent Exercises
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom actions */}
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2.5 rounded-md cursor-pointer hover:bg-[#F9FAFB] text-[#6B7280] transition-colors px-3 py-2"
            title={sidebarCollapsed ? "Search ⌘K" : undefined}
          >
            <Search size={18} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap ${fade}`}>
              Search{" "}
              <kbd className="text-[10px] font-medium text-[#9CA3AF] ml-1">
                ⌘K
              </kbd>
            </span>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2.5 rounded-md cursor-pointer hover:bg-[#F9FAFB] text-[#6B7280] transition-colors px-3 py-2"
            title={sidebarCollapsed ? "Settings" : undefined}
          >
            <Settings size={18} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap ${fade}`}>
              Settings
            </span>
          </button>
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-3 border-t border-[#F3F4F6]">
          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-[#6B7280]">U</span>
          </div>
          <span
            className={`text-sm font-medium text-[#0a0a0a] truncate ${fade}`}
          >
            User Name
          </span>
        </div>
      </div>
    </motion.aside>
  );
}
