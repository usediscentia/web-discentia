"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, ArrowRight, Cpu } from "lucide-react";
import { ProviderIcon, ModelIcon } from "@lobehub/icons";
import { useProviderStore } from "@/stores/provider.store";
import { useAppStore } from "@/stores/app.store";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import type { AIProviderType } from "@/types/ai";

// ── Provider visual metadata matching design.pen ──

interface ProviderMeta {
  id: AIProviderType;
  name: string;
  /** String key for @lobehub/icons ProviderIcon */
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
    id: "gemini",
    name: "Gemini",
    lobeProvider: "google",
    badgeLabel: "Google",
    badgeBg: "#EEF2FF",
    badgeText: "#4338CA",
    comingSoon: true,
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

// ── Component ──

interface AIProviderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIProviderSelector({
  isOpen,
  onClose,
}: AIProviderSelectorProps) {
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

  useEffect(() => {
    if (isOpen) {
      checkOllamaConnection();
      if (selectedProvider === "github-copilot") {
        void fetchGithubCopilotModels();
      }
    }
  }, [isOpen, checkOllamaConnection, selectedProvider, fetchGithubCopilotModels]);

  const handleSelectProvider = (id: AIProviderType) => {
    setSelectedProvider(id);
  };

  const handleSelectModel = (providerId: AIProviderType, model: string) => {
    if (providerId !== selectedProvider) {
      setSelectedProvider(providerId);
    }
    setSelectedModel(model);
  };

  const { setActiveView } = useAppStore();

  const handleManageKeys = () => {
    onClose();
    setActiveView("settings");
  };

  const getModelsForProvider = (id: AIProviderType): string[] => {
    if (id === "ollama") return ollamaModels;
    if (id === "github-copilot") return githubCopilotModels;
    return PROVIDER_DEFAULTS[id].models;
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
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
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
                const models = getModelsForProvider(provider.id);

                return (
                  <div key={provider.id}>
                    {/* Provider row */}
                    <button
                      onClick={() =>
                        !provider.comingSoon &&
                        handleSelectProvider(provider.id)
                      }
                      className={`flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 transition-colors ${
                        provider.comingSoon
                          ? "opacity-40 cursor-default"
                          : "cursor-pointer hover:bg-[#fafafa]"
                      } ${isSelected && !provider.comingSoon ? "bg-[#f5f5f5]" : ""}`}
                    >
                      {/* Radio */}
                      <div
                        className={`flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 shrink-0 transition-colors ${
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
                        <ProviderIcon
                          provider={provider.lobeProvider}
                          size={18}
                          type="color"
                        />
                      </div>

                      {/* Name */}
                      <span
                        className={`text-sm text-[#0a0a0a] ${
                          isSelected && !provider.comingSoon
                            ? "font-semibold"
                            : "font-medium"
                        }`}
                      >
                        {provider.name}
                      </span>

                      {/* Badge */}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: provider.badgeBg,
                          color: provider.badgeText,
                        }}
                      >
                        {provider.badgeLabel}
                      </span>

                      {/* Spacer + Chevron for selected */}
                      {isSelected && !provider.comingSoon && models.length > 0 && (
                        <>
                          <div className="flex-1" />
                          <ChevronDown
                            size={14}
                            className="text-[#737373] shrink-0"
                          />
                        </>
                      )}
                    </button>

                    {/* Model Sub-selector */}
                    <AnimatePresence initial={false}>
                      {isSelected &&
                        !provider.comingSoon &&
                        models.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-0.5 pl-[38px] pr-2.5 pt-1 pb-2">
                              {/* Model label */}
                              <div className="flex items-center gap-1.5 pb-1">
                                <Cpu
                                  size={12}
                                  className="text-[#737373]"
                                />
                                <span className="text-[11px] font-medium text-[#737373]">
                                  Model
                                </span>
                              </div>

                              {/* Model items */}
                              {models.map((model) => {
                                const isModelSelected =
                                  selectedModel === model;
                                const tag = MODEL_TAGS[model];

                                return (
                                  <button
                                    key={model}
                                    onClick={() =>
                                      handleSelectModel(
                                        provider.id,
                                        model
                                      )
                                    }
                                    className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-[13px] transition-colors cursor-pointer ${
                                      isModelSelected
                                        ? "bg-[#fafafa]"
                                        : "hover:bg-[#fafafa]/60"
                                    }`}
                                  >
                                    {/* Check or spacer */}
                                    {isModelSelected ? (
                                      <Check
                                        size={14}
                                        className="text-[#171717] shrink-0"
                                        strokeWidth={2.5}
                                      />
                                    ) : (
                                      <div className="w-3.5 shrink-0" />
                                    )}

                                    {/* Model icon from @lobehub/icons */}
                                    <div className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                                      <ModelIcon
                                        model={model}
                                        size={14}
                                        type="color"
                                      />
                                    </div>

                                    {/* Model name */}
                                    <span
                                      className={
                                        isModelSelected
                                          ? "font-semibold text-[#0a0a0a]"
                                          : "text-[#737373]"
                                      }
                                    >
                                      {model}
                                    </span>

                                    {/* Spacer + Tag */}
                                    <div className="flex-1" />
                                    {tag && (
                                      <span className="text-[10px] font-medium text-[#737373]">
                                        {tag}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
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
              className="flex items-center gap-2 w-full px-4 py-1 cursor-pointer hover:bg-[#fafafa] transition-colors"
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
