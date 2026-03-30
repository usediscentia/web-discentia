"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, ArrowRight, Cpu, Search } from "lucide-react";
import { ProviderIcon, ModelIcon } from "@lobehub/icons";
import { useProviderStore } from "@/stores/provider.store";
import { useAppStore } from "@/stores/app.store";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import type { AIProviderType } from "@/types/ai";

// ── Provider visual metadata ──

interface ProviderMeta {
  id: AIProviderType;
  name: string;
  lobeProvider: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  comingSoon?: boolean;
}

const providers: ProviderMeta[] = [
  {
    id: "anthropic",
    name: "Claude",
    lobeProvider: "anthropic",
    badgeLabel: "Anthropic",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
  },
  {
    id: "openai",
    name: "OpenAI",
    lobeProvider: "openai",
    badgeLabel: "OpenAI",
    badgeBg: "#DCFCE7",
    badgeText: "#166534",
  },
  {
    id: "ollama",
    name: "Ollama",
    lobeProvider: "ollama",
    badgeLabel: "Local",
    badgeBg: "#F3E8FF",
    badgeText: "#6B21A8",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    lobeProvider: "openrouter",
    badgeLabel: "Multi",
    badgeBg: "#FCE7F3",
    badgeText: "#9D174D",
  },
  {
    id: "github-copilot" as AIProviderType,
    name: "GitHub Copilot",
    lobeProvider: "github-copilot",
    badgeLabel: "Copilot",
    badgeBg: "#F0FDF4",
    badgeText: "#166534",
  },
];

// ── Model tags ──

const MODEL_TAGS: Record<string, string> = {
  "gpt-4o": "Fast",
  "gpt-4o-mini": "Cheap",
  "gpt-4-turbo": "Power",
  "openai/gpt-4o": "Fast",
  "anthropic/claude-3.5-sonnet": "Smart",
  "google/gemini-2.0-flash-exp:free": "Free",
  "meta-llama/llama-3.1-70b-instruct": "Open",
};

// ── Model grouping for large lists ──

const GROUP_PREFIXES: Array<{ label: string; prefixes: string[] }> = [
  { label: "OpenAI", prefixes: ["gpt-", "o1-", "o3-", "o4-", "text-embedding"] },
  { label: "Anthropic", prefixes: ["claude-"] },
  { label: "Google", prefixes: ["gemini-"] },
  { label: "Meta", prefixes: ["llama", "meta-llama"] },
];

function getModelGroup(model: string): string {
  const lower = model.toLowerCase();
  for (const { label, prefixes } of GROUP_PREFIXES) {
    if (prefixes.some((p) => lower.startsWith(p))) return label;
  }
  return "Other";
}

function groupModels(models: string[]): Array<{ label: string; items: string[] }> {
  const buckets: Record<string, string[]> = {};
  for (const m of models) {
    const g = getModelGroup(m);
    (buckets[g] ??= []).push(m);
  }
  const ORDER = ["OpenAI", "Anthropic", "Google", "Meta", "Other"];
  return ORDER.filter((g) => buckets[g]).map((g) => ({ label: g, items: buckets[g] }));
}

function truncateModel(model: string, max = 18): string {
  if (model.length <= max) return model;
  return model.slice(0, max - 1) + "…";
}

// ── Component ──

interface AIProviderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIProviderSelector({ isOpen, onClose }: AIProviderSelectorProps) {
  const {
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    ollamaModels,
    checkOllamaConnection,
    githubCopilotModels,
    fetchGithubCopilotModels,
  } = useProviderStore();
  const { setActiveView } = useAppStore();

  const [modelSearch, setModelSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      checkOllamaConnection();
      if (selectedProvider === "github-copilot") {
        void fetchGithubCopilotModels();
      }
    }
  }, [isOpen, checkOllamaConnection, selectedProvider, fetchGithubCopilotModels]);

  // Reset search when switching providers
  useEffect(() => {
    setModelSearch("");
  }, [selectedProvider]);

  const getModels = (id: AIProviderType): string[] => {
    if (id === "ollama") return ollamaModels;
    if (id === "github-copilot") return githubCopilotModels;
    return PROVIDER_DEFAULTS[id].models;
  };

  const activeModels = getModels(selectedProvider);
  const showSearch = activeModels.length > 5;

  const filteredModels = useMemo(() => {
    const q = modelSearch.toLowerCase().trim();
    if (!q) return activeModels;
    return activeModels.filter((m) => m.toLowerCase().includes(q));
  }, [activeModels, modelSearch]);

  const grouped = useMemo(() => {
    if (!showSearch) return null;
    return groupModels(filteredModels);
  }, [showSearch, filteredModels]);

  const handleSelectProvider = (id: AIProviderType) => {
    setSelectedProvider(id);
  };

  const handleSelectModel = (providerId: AIProviderType, model: string) => {
    if (providerId !== selectedProvider) setSelectedProvider(providerId);
    setSelectedModel(model);
  };

  const handleManageKeys = () => {
    onClose();
    setActiveView("settings");
  };

  const renderModelButton = (model: string, providerId: AIProviderType) => {
    const isModelSelected = selectedModel === model;
    const tag = MODEL_TAGS[model];
    return (
      <button
        key={model}
        onClick={() => handleSelectModel(providerId, model)}
        className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-[13px] transition-[background-color,transform] duration-150 ease-out cursor-pointer active:scale-[0.98] ${
          isModelSelected
            ? "bg-[#fafafa]"
            : "[@media(hover:hover)]:hover:bg-[#fafafa]/60"
        }`}
      >
        {isModelSelected ? (
          <Check size={14} className="text-[#171717] shrink-0" strokeWidth={2.5} />
        ) : (
          <div className="w-3.5 shrink-0" />
        )}

        <div className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
          <ModelIcon model={model} size={14} type="color" />
        </div>

        <span
          className={`flex-1 text-left truncate ${
            isModelSelected ? "font-semibold text-[#0a0a0a]" : "text-[#737373]"
          }`}
        >
          {model}
        </span>

        {tag && (
          <span className="text-[10px] font-medium text-[#737373] shrink-0">{tag}</span>
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            variants={{
              enter: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
              },
              exit: {
                opacity: 0,
                y: 4,
                scale: 0.97,
                transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
              },
            }}
            animate="enter"
            exit="exit"
            style={{ originY: 1 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-[340px] bg-white rounded-xl border border-[#E5E7EB] shadow-[0_8px_12px_-4px_rgba(0,0,0,0.08),0_2px_4px_-2px_rgba(0,0,0,0.04)] py-3"
          >
            {/* Header */}
            <div className="px-4 pb-2">
              <h3 className="text-[13px] font-semibold text-[#0a0a0a] tracking-wide">
                AI Provider
              </h3>
            </div>

            {/* Provider List */}
            <div className="flex flex-col gap-0.5 px-1.5">
              {providers.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                const models = getModels(provider.id);
                const hasModels = models.length > 0;

                return (
                  <div key={provider.id}>
                    {/* Provider row */}
                    <button
                      onClick={() => !provider.comingSoon && handleSelectProvider(provider.id)}
                      className={`flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 transition-[background-color,transform] duration-150 ease-out ${
                        provider.comingSoon
                          ? "opacity-40 cursor-default"
                          : "cursor-pointer [@media(hover:hover)]:hover:bg-[#fafafa] active:scale-[0.98]"
                      } ${isSelected && !provider.comingSoon ? "bg-[#f5f5f5]" : ""}`}
                    >
                      {/* Radio */}
                      <div
                        className={`flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 shrink-0 transition-colors duration-150 ease-out ${
                          isSelected && !provider.comingSoon
                            ? "border-[#171717]"
                            : "border-[#e5e5e5]"
                        }`}
                      >
                        {isSelected && !provider.comingSoon && (
                          <div className="w-2 h-2 rounded-full bg-[#171717]" />
                        )}
                      </div>

                      {/* Provider logo */}
                      <div className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
                        <ProviderIcon provider={provider.lobeProvider} size={18} type="color" />
                      </div>

                      {/* Name + selected model hint */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span
                          className={`text-sm text-[#0a0a0a] shrink-0 ${
                            isSelected && !provider.comingSoon ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {provider.name}
                        </span>
                        {isSelected && !provider.comingSoon && selectedModel && (
                          <span className="text-[11px] text-[#9CA3AF] truncate">
                            · {truncateModel(selectedModel)}
                          </span>
                        )}
                      </div>

                      {/* Badge */}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: provider.badgeBg, color: provider.badgeText }}
                      >
                        {provider.badgeLabel}
                      </span>

                      {/* Chevron */}
                      {!provider.comingSoon && hasModels && (
                        <ChevronDown
                          size={14}
                          className={`text-[#737373] shrink-0 transition-transform duration-200 ease-out ${
                            isSelected ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Model Sub-selector */}
                    <AnimatePresence initial={false}>
                      {isSelected && !provider.comingSoon && hasModels && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { duration: 0.12, delay: 0.07, ease: "easeOut" } }}
                            exit={{ opacity: 0, transition: { duration: 0.07 } }}
                          >
                            <div className="pl-[38px] pr-2.5 pt-1 pb-2">
                              {/* Section label */}
                              <div className="flex items-center gap-1.5 pb-1.5">
                                <Cpu size={12} className="text-[#737373]" />
                                <span className="text-[11px] font-medium text-[#737373]">
                                  Model
                                </span>
                                {showSearch && (
                                  <span className="text-[11px] text-[#C4C4C4]">
                                    · {activeModels.length} available
                                  </span>
                                )}
                              </div>

                              {/* Search input — shown only when many models */}
                              {showSearch && (
                                <div className="relative mb-2">
                                  <Search
                                    size={11}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#C4C4C4] pointer-events-none"
                                  />
                                  <input
                                    value={modelSearch}
                                    onChange={(e) => setModelSearch(e.target.value)}
                                    placeholder="Filter models…"
                                    className="w-full bg-[#F8F9FA] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-[#1A1A1A] placeholder:text-[#C4C4C4] outline-none border border-transparent focus:border-[#E5E7EB] focus:bg-white transition-[border-color,background-color] duration-150 ease-out"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}

                              {/* Model list */}
                              <div
                                className={`flex flex-col gap-0.5 ${
                                  showSearch ? "max-h-[220px] overflow-y-auto" : ""
                                }`}
                              >
                                {grouped ? (
                                  grouped.length === 0 ? (
                                    <p className="text-[12px] text-[#9CA3AF] px-2 py-3 text-center">
                                      No models match &ldquo;{modelSearch}&rdquo;
                                    </p>
                                  ) : (
                                    grouped.map(({ label, items }) => (
                                      <div key={label}>
                                        <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
                                          <span className="text-[9px] font-bold text-[#C4C4C4] uppercase tracking-wider">
                                            {label}
                                          </span>
                                          <div className="flex-1 h-px bg-[#F3F4F6]" />
                                          <span className="text-[9px] text-[#D1D5DB]">
                                            {items.length}
                                          </span>
                                        </div>
                                        {items.map((model) =>
                                          renderModelButton(model, provider.id)
                                        )}
                                      </div>
                                    ))
                                  )
                                ) : (
                                  filteredModels.map((model) =>
                                    renderModelButton(model, provider.id)
                                  )
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="px-4 py-1">
              <div className="w-full h-px bg-[#e5e5e5]" />
            </div>

            {/* Footer */}
            <button
              onClick={handleManageKeys}
              className="flex items-center gap-2 w-full px-4 py-1 cursor-pointer [@media(hover:hover)]:hover:bg-[#fafafa] active:scale-[0.98] transition-[background-color,transform] duration-150 ease-out"
            >
              <span className="text-[13px] font-medium text-[#737373]">
                Manage API Keys
              </span>
              <ArrowRight size={14} className="text-[#737373]" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
