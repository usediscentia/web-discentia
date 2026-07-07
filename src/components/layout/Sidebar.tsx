"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Layers,
  Sparkles,
  Settings,
  ChevronLeft,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore, type ActiveView } from "@/stores/app.store";
import { useDialogStore } from "@/stores/dialog.store";
import { StorageService } from "@/services/storage";

const primaryNav: { id: ActiveView; label: string; icon: LucideIcon }[] = [
  { id: "decks", label: "Decks", icon: Layers },
  { id: "study", label: "Estudar", icon: Sparkles },
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
  } = useAppStore();
  const setSettingsOpen = useDialogStore((s) => s.setSettingsOpen);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    StorageService.getDashboardStats().then((s) => setDueCount(s.dueToday));
  }, [activeView]);

  const fade = `transition-opacity duration-200 ${
    sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
  }`;

  const renderNavItem = (
    item: { id: ActiveView; label: string; icon: LucideIcon },
    showBadge?: boolean
  ) => {
    const isActive = activeView === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => setActiveView(item.id)}
        className={`flex items-center gap-3 rounded-md cursor-pointer transition-colors px-3 py-2 ${
          isActive
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/60"
        }`}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <Icon size={18} className="shrink-0" />
        <span className={`text-sm whitespace-nowrap ${fade}`}>{item.label}</span>
        {showBadge && dueCount > 0 && !sidebarCollapsed && (
          <span className="ml-auto min-w-[18px] rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-semibold text-primary-foreground">
            {dueCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="hidden h-screen shrink-0 overflow-hidden border-r border-border bg-sidebar select-none md:flex md:flex-col"
    >
      <div className="flex flex-col h-full" style={{ width: EXPANDED_W }}>
        {/* Header */}
        <div className="flex items-center h-14 shrink-0 px-4">
          <motion.div
            className={`shrink-0 flex items-center ${sidebarCollapsed ? "cursor-pointer" : ""}`}
            onClick={sidebarCollapsed ? () => setSidebarCollapsed(false) : undefined}
            whileHover={sidebarCollapsed ? { scale: 1.06 } : {}}
            whileTap={sidebarCollapsed ? { scale: 0.94 } : {}}
            role={sidebarCollapsed ? "button" : undefined}
            tabIndex={sidebarCollapsed ? 0 : undefined}
            title={sidebarCollapsed ? "Expand sidebar" : undefined}
          >
            <svg width="30" height="26" viewBox="0 0 425 356" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M74.5 70.5V1.5H350.5V70.5H419.5V208.5H350.5V346.5C312.392 346.5 281.5 315.608 281.5 277.5H212.5C174.392 277.5 143.5 246.608 143.5 208.5H5.5V70.5H74.5Z" fill="#FF5787"/>
            </svg>
          </motion.div>

          <span
            className={`ml-2 whitespace-nowrap text-foreground ${fade}`}
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-0.3px",
            }}
          >
            Discentia
          </span>

          <div className="flex-1" />

          <button
            onClick={() => setSidebarCollapsed(true)}
            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted ${
              sidebarCollapsed
                ? "opacity-0 pointer-events-none scale-75"
                : "opacity-100 scale-100"
            }`}
            tabIndex={sidebarCollapsed ? -1 : 0}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Principal section */}
        <div className="flex flex-col gap-0.5 px-2 mt-2">
          <span className={`mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${fade}`}>
            Principal
          </span>
          {primaryNav.map((item) => renderNavItem(item, item.id === "study"))}
        </div>

        {/* Secundário section */}
        <div className="flex flex-col gap-0.5 px-2 mt-4">
          <span className={`mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ${fade}`}>
            Secundário
          </span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 rounded-md cursor-pointer transition-colors px-3 py-2 text-muted-foreground hover:bg-muted/60"
            title={sidebarCollapsed ? "Configurações" : undefined}
          >
            <Settings size={18} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap ${fade}`}>Configurações</span>
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom actions */}
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/60"
            title={sidebarCollapsed ? "Buscar ⌘K" : undefined}
          >
            <Search size={18} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap ${fade}`}>
              Buscar{" "}
              <kbd className="ml-1 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </span>
          </button>
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 border-t border-border px-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-medium text-muted-foreground">U</span>
          </div>
          <span className={`truncate text-sm font-medium text-foreground ${fade}`}>
            User Name
          </span>
        </div>
      </div>
    </motion.aside>
  );
}
