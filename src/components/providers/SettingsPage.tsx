"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  User,
  Palette,
  Bell,
  Shield,
  Check,
  X,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { ProviderIcon } from "@lobehub/icons";
import { useProviderStore } from "@/stores/provider.store";
import { getAIProvider } from "@/services/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import type { AIProviderType } from "@/types/ai";
import { Input } from "@/components/ui/input";

// ── Types ──

type SettingsSection = "providers" | "account" | "appearance" | "notifications" | "privacy";

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: typeof Cpu;
  enabled: boolean;
}

// ── Provider metadata ──

interface ProviderDisplay {
  type: AIProviderType;
  lobeProvider: string;
  description: string;
  comingSoon: boolean;
}

const providerDisplays: ProviderDisplay[] = [
  {
    type: "ollama",
    lobeProvider: "ollama",
    description: "Run models locally on your machine. No API key required.",
    comingSoon: false,
  },
  {
    type: "openai",
    lobeProvider: "openai",
    description: "Access GPT-4o, GPT-4 Turbo, and other OpenAI models.",
    comingSoon: false,
  },
  {
    type: "openrouter",
    lobeProvider: "openrouter",
    description: "Single API key for hundreds of models from every provider.",
    comingSoon: false,
  },
  {
    type: "anthropic",
    lobeProvider: "anthropic",
    description: "Claude models by Anthropic for nuanced reasoning.",
    comingSoon: true,
  },
  {
    type: "gemini",
    lobeProvider: "google",
    description: "Google Gemini models with multimodal capabilities.",
    comingSoon: true,
  },
];

// ── Nav items ──

const navItems: NavItem[] = [
  { id: "providers", label: "AI Providers", icon: Cpu, enabled: true },
  { id: "account", label: "Account", icon: User, enabled: false },
  { id: "appearance", label: "Appearance", icon: Palette, enabled: false },
  { id: "notifications", label: "Notifications", icon: Bell, enabled: false },
  { id: "privacy", label: "Data & Privacy", icon: Shield, enabled: false },
];

// ── Provider Row Component ──

function ProviderRow({ display }: { display: ProviderDisplay }) {
  const {
    providerConfigs,
    setProviderConfig,
    ollamaStatus,
    ollamaModels,
    checkOllamaConnection,
    saveProviderConfigs,
  } = useProviderStore();

  const defaults = PROVIDER_DEFAULTS[display.type];
  const config = providerConfigs[display.type];
  const [expanded, setExpanded] = useState(false);
  const [localKey, setLocalKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (expanded) {
      setLocalKey(config.apiKey);
      setResult(null);
    }
  }, [expanded, config.apiKey]);

  const isOllama = display.type === "ollama";
  const hasKey = config.apiKey.length > 0;

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    if (isOllama) {
      await checkOllamaConnection();
      const status = useProviderStore.getState().ollamaStatus;
      setResult(status === "connected" ? "success" : "error");
    } else {
      const key = localKey.trim();
      if (!key) {
        setTesting(false);
        return;
      }

      setProviderConfig(display.type, { ...config, apiKey: key });

      const provider = getAIProvider(display.type);
      if (!provider) {
        setResult("error");
        setTesting(false);
        return;
      }

      const valid = await provider.validateApiKey(key);
      setResult(valid ? "success" : "error");

      if (valid) {
        setTimeout(() => {
          saveProviderConfigs();
        }, 0);
      }
    }

    setTesting(false);
  };

  const statusBadge = () => {
    if (isOllama) {
      if (ollamaStatus === "connected") {
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
        );
      }
      if (ollamaStatus === "disconnected") {
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Not running
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#888] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CCC]" />
          Unknown
        </span>
      );
    }

    if (display.comingSoon) {
      return (
        <span className="text-[11px] font-medium text-[#888] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
          Coming Soon
        </span>
      );
    }

    if (hasKey) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Configured
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#888] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
        Not configured
      </span>
    );
  };

  return (
    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
      {/* Row header */}
      <button
        onClick={() => !display.comingSoon && setExpanded(!expanded)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
          display.comingSoon
            ? "opacity-50 cursor-default"
            : "cursor-pointer hover:bg-[#FAFAFA]"
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-[#F9FAFB] border border-[#F0F0F0] flex items-center justify-center shrink-0">
          <ProviderIcon provider={display.lobeProvider} size={22} type="color" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#111]">
              {defaults.displayName}
            </span>
            {statusBadge()}
          </div>
          <p className="text-xs text-[#888] mt-0.5">{display.description}</p>
        </div>
        {!display.comingSoon && (
          <ChevronRight
            size={16}
            className={`text-[#CCC] shrink-0 transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      {/* Expanded config */}
      <AnimatePresence initial={false}>
        {expanded && !display.comingSoon && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-[#F0F0F0]">
              {isOllama ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#666]">
                      {ollamaStatus === "connected" && ollamaModels.length > 0 ? (
                        <>
                          <span className="font-medium text-[#333]">
                            {ollamaModels.length} model{ollamaModels.length !== 1 ? "s" : ""} available:
                          </span>{" "}
                          {ollamaModels.slice(0, 5).join(", ")}
                          {ollamaModels.length > 5 && ` +${ollamaModels.length - 5} more`}
                        </>
                      ) : (
                        "Make sure Ollama is running on your machine."
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTest}
                      disabled={testing}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#111] text-white rounded-lg cursor-pointer hover:bg-[#222] transition-colors disabled:opacity-50"
                    >
                      {testing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : null}
                      {testing ? "Testing..." : "Test Connection"}
                    </button>
                    <a
                      href="https://ollama.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#888] hover:text-[#555] transition-colors"
                    >
                      Get Ollama
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  {result && (
                    <ResultBadge result={result} type="ollama" />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#555] block mb-1.5">
                      API Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={localKey}
                        onChange={(e) => {
                          setLocalKey(e.target.value);
                          setResult(null);
                        }}
                        placeholder={`Enter your ${defaults.displayName} API key`}
                        className="pr-10 text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AAA] hover:text-[#666] transition-colors cursor-pointer"
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTest}
                      disabled={testing || !localKey.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#111] text-white rounded-lg cursor-pointer hover:bg-[#222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : null}
                      {testing ? "Testing..." : "Save & Test"}
                    </button>
                  </div>
                  {result && (
                    <ResultBadge result={result} type={display.type} />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultBadge({
  result,
  type,
}: {
  result: "success" | "error";
  type: AIProviderType;
}) {
  if (result === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg"
      >
        <Check size={13} className="text-emerald-600" />
        {type === "ollama" ? "Ollama is running and reachable." : "Connected successfully. API key saved."}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg"
    >
      <X size={13} className="text-red-500" />
      {type === "ollama"
        ? "Could not connect. Make sure Ollama is running."
        : "Invalid API key. Please check and try again."}
    </motion.div>
  );
}

// ── Placeholder sections ──

function ComingSoonSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-3">
        <Palette size={20} className="text-[#999]" />
      </div>
      <p className="text-sm font-medium text-[#555]">{title}</p>
      <p className="text-xs text-[#999] mt-1">This section is coming soon.</p>
    </div>
  );
}

// ── Main Settings Page ──

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("providers");

  const { checkOllamaConnection } = useProviderStore();

  useEffect(() => {
    checkOllamaConnection();
  }, [checkOllamaConnection]);

  return (
    <div className="flex h-full w-full bg-[#FAFAFA]">
      {/* Left nav */}
      <nav className="w-52 shrink-0 border-r border-[#ECECEC] bg-white px-3 py-8">
        <h1 className="text-lg font-bold text-[#111] px-3 mb-6">Settings</h1>
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.enabled && setActiveSection(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  !item.enabled
                    ? "opacity-40 cursor-default"
                    : isActive
                    ? "bg-[#F3F4F6] text-[#111] font-medium cursor-pointer"
                    : "text-[#666] hover:bg-[#F9FAFB] cursor-pointer"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#111]" : "text-[#999]"} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-auto px-10 py-8">
        <AnimatePresence mode="wait">
          {activeSection === "providers" && (
            <motion.div
              key="providers"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#111]">AI Providers</h2>
                <p className="text-sm text-[#888] mt-1">
                  Configure your AI providers. API keys are encrypted and stored locally on your device.
                </p>
              </div>
              <div className="space-y-3">
                {providerDisplays.map((display) => (
                  <ProviderRow key={display.type} display={display} />
                ))}
              </div>
            </motion.div>
          )}
          {activeSection !== "providers" && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ComingSoonSection
                title={navItems.find((n) => n.id === activeSection)?.label || "Settings"}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
