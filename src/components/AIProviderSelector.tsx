"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  SparklesIcon,
  BoltIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/stores/app.store";
import type { AIProviderType } from "@/types/ai";

interface AIProviderUI {
  id: AIProviderType;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  comingSoon?: boolean;
}

const providers: AIProviderUI[] = [
  { id: "openai", name: "GPT-4o (OpenAI)", icon: BoltIcon },
  { id: "anthropic", name: "Claude (Anthropic)", icon: SparklesIcon, comingSoon: true },
  { id: "gemini", name: "Gemini (Google)", icon: GlobeAltIcon, comingSoon: true },
];

interface AIProviderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIProviderSelector({
  isOpen,
  onClose,
}: AIProviderSelectorProps) {
  const { selectedProvider, setSelectedProvider, setSettingsOpen } = useAppStore();

  const handleSelect = (id: AIProviderType) => {
    setSelectedProvider(id);
  };

  const handleManageKeys = () => {
    onClose();
    setSettingsOpen(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-[280px] bg-white rounded-xl border border-[#E5E7EB] shadow-[0_8px_12px_-4px_rgba(0,0,0,0.08),0_2px_4px_-2px_rgba(0,0,0,0.04)] py-4"
          >
            <div className="px-4 pb-2">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Select AI Provider
              </h3>
            </div>

            <div className="flex flex-col gap-1">
              {providers.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                const Icon = provider.icon;

                return (
                  <button
                    key={provider.id}
                    onClick={() => !provider.comingSoon && handleSelect(provider.id)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 transition-colors ${
                      provider.comingSoon
                        ? "opacity-50 cursor-default"
                        : "cursor-pointer"
                    } ${
                      isSelected
                        ? "bg-[#F3F4F6]"
                        : provider.comingSoon
                        ? ""
                        : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-4 h-4 rounded-lg border-2 shrink-0 ${
                        isSelected
                          ? "border-[#1A1A1A]"
                          : "border-[#E5E7EB]"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
                      )}
                    </div>
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-[#1A1A1A]" : "text-[#6B7280]"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isSelected
                          ? "font-semibold text-[#1A1A1A]"
                          : "text-[#1A1A1A]"
                      }`}
                    >
                      {provider.name}
                      {provider.comingSoon && (
                        <span className="ml-1 text-xs text-[#9CA3AF]">
                          (soon)
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-1">
              <div className="w-full h-px bg-[#E5E7EB]" />
            </div>

            <button
              onClick={handleManageKeys}
              className="flex items-center gap-2 w-full px-4 py-2 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
            >
              <span className="text-[13px] font-medium text-[#6B7280]">
                Manage API Keys
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
