"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Palette,
  BookOpen,
  Shield,
  Keyboard,
  Check,
  X,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { ProviderIcon } from "@lobehub/icons";
import { useProviderStore } from "@/stores/provider.store";
import { useAppStore } from "@/stores/app.store";
import { useAppearanceStore } from "@/stores/appearance.store";
import { useShallow } from "zustand/react/shallow";
import { getAIProvider } from "@/services/ai";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import type { AIProviderType } from "@/types/ai";
import { ACCENT_COLORS, type ThemeOption } from "@/lib/appearance";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getDB } from "@/services/storage/database";
import { GitHubCopilotConnect } from "@/components/providers/GitHubCopilotConnect";

// ── Types ──

type SettingsSection = "providers" | "appearance" | "study" | "privacy" | "shortcuts";

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
    comingSoon: false,
  },
  {
    type: "github-copilot",
    lobeProvider: "github-copilot",
    description: "GitHub Copilot Chat — GPT-4o, o1, Claude, Gemini and more with your Copilot subscription.",
    comingSoon: false,
  },
];

// ── Nav items ──

const navItems: NavItem[] = [
  { id: "providers", label: "AI Providers", icon: Cpu, enabled: true },
  { id: "appearance", label: "Appearance", icon: Palette, enabled: true },
  { id: "study", label: "Study", icon: BookOpen, enabled: true },
  { id: "privacy", label: "Data & Privacy", icon: Shield, enabled: true },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard, enabled: true },
];

// ── Keyboard shortcuts data ──

const SHORTCUTS = {
  Navigation: [
    { action: "Open Chat", keys: ["⌘", "1"] },
    { action: "Open Library", keys: ["⌘", "2"] },
    { action: "Open Editor", keys: ["⌘", "3"] },
    { action: "Global Search", keys: ["⌘", "K"] },
  ],
  Editor: [
    { action: "Save note", keys: ["⌘", "S"] },
    { action: "New note", keys: ["⌘", "N"] },
  ],
};

// ── Provider Row ──

function ProviderRow({ display }: { display: ProviderDisplay }) {
  const {
    providerConfigs,
    selectedProvider,
    setSelectedModel,
    setProviderConfig,
    ollamaStatus,
    ollamaModels,
    checkOllamaConnection,
    saveProviderConfig,
  } = useProviderStore();

  const defaults = PROVIDER_DEFAULTS[display.type];
  const config = providerConfigs[display.type];
  const [expanded, setExpanded] = useState(false);
  const [localKey, setLocalKey] = useState("");
  const [localTemp, setLocalTemp] = useState("");
  const [localBaseUrl, setLocalBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (expanded) {
      setLocalKey(config.apiKey); // eslint-disable-line react-hooks/set-state-in-effect
      setResult(null);
    }
  }, [expanded, config.apiKey]);

  useEffect(() => {
    if (expanded) {
      setLocalTemp(config.temperature !== undefined ? String(config.temperature) : ""); // eslint-disable-line react-hooks/set-state-in-effect
      setLocalBaseUrl(config.baseUrl ?? "");
    }
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps -- only resets form on expand/collapse, not on every config change mid-edit

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
          void saveProviderConfig(display.type, key);
        }, 0);
      }
    }

    setTesting(false);
  };

  const handleModelChange = (model: string) => {
    if (display.type === selectedProvider) {
      setSelectedModel(model);
    } else {
      setProviderConfig(display.type, { ...config, model });
    }
  };

  const handleTempBlur = () => {
    const parsed = parseFloat(localTemp);
    const value = !isNaN(parsed) ? Math.max(0, Math.min(2, parsed)) : undefined;
    setProviderConfig(display.type, { ...config, temperature: value });
  };

  const handleBaseUrlBlur = () => {
    const value = localBaseUrl.trim() || undefined;
    setProviderConfig(display.type, { ...config, baseUrl: value });
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        Not configured
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-sm">
      <button
        onClick={() => !display.comingSoon && setExpanded(!expanded)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
          display.comingSoon
            ? "opacity-50 cursor-default"
            : "cursor-pointer hover:bg-muted/50"
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
          <ProviderIcon provider={display.lobeProvider} size={22} type="color" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {defaults.displayName}
            </span>
            {statusBadge()}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{display.description}</p>
        </div>
        {!display.comingSoon && (
          <ChevronRight
            size={16}
            className={`shrink-0 text-border transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && !display.comingSoon && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pb-5 pt-1">
              {isOllama ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {ollamaStatus === "connected" && ollamaModels.length > 0 ? (
                        <>
                          <span className="font-medium text-foreground">
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
                  {ollamaStatus === "connected" && ollamaModels.length > 0 && (
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">Model</Label>
                      <Select value={ollamaModels.includes(config.model) ? config.model : ollamaModels[0]} onValueChange={handleModelChange}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ollamaModels.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Temperature <span className="font-normal text-muted-foreground">(0.0 – 2.0)</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={localTemp}
                      onChange={(e) => setLocalTemp(e.target.value)}
                      onBlur={handleTempBlur}
                      placeholder="Default"
                      className="text-sm w-28"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Base URL <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      type="text"
                      value={localBaseUrl}
                      onChange={(e) => setLocalBaseUrl(e.target.value)}
                      onBlur={handleBaseUrlBlur}
                      placeholder="http://localhost:11434"
                      className="text-sm font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTest}
                      disabled={testing}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
                    >
                      {testing ? <Loader2 size={12} className="animate-spin" /> : null}
                      {testing ? "Testing..." : "Test Connection"}
                    </button>
                    <a
                      href="https://ollama.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Get Ollama
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  {result && <ResultBadge result={result} type="ollama" />}
                </div>
              ) : display.type === "github-copilot" ? (
                  <GitHubCopilotConnect />
                ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      API Key
                      {defaults.apiKeyDescription && (
                        <span className="ml-1 font-normal text-muted-foreground">— {defaults.apiKeyDescription}</span>
                      )}
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
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  {defaults.models.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium text-[#555] block mb-1.5">Model</Label>
                      <Select value={config.model} onValueChange={handleModelChange}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {defaults.models.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Temperature <span className="font-normal text-muted-foreground">(0.0 – 2.0)</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={localTemp}
                      onChange={(e) => setLocalTemp(e.target.value)}
                      onBlur={handleTempBlur}
                      placeholder="Default"
                      className="text-sm w-28"
                    />
                  </div>
                  {display.type === "openai" && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-foreground">
                        Base URL <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <Input
                        type="text"
                        value={localBaseUrl}
                        onChange={(e) => setLocalBaseUrl(e.target.value)}
                        onBlur={handleBaseUrlBlur}
                        placeholder="https://api.openai.com/v1"
                        className="text-sm font-mono"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTest}
                      disabled={testing || !localKey.trim()}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {testing ? <Loader2 size={12} className="animate-spin" /> : null}
                      {testing ? "Testing..." : "Save & Test"}
                    </button>
                  </div>
                  {result && <ResultBadge result={result} type={display.type} />}
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

// ── Appearance Section ──

function AppearanceSection() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { theme, accentColor, fontSize, setTheme, setAccentColor, setFontSize } =
    useAppearanceStore(useShallow((state) => ({
      theme: state.theme,
      accentColor: state.accentColor,
      fontSize: state.fontSize,
      setTheme: state.setTheme,
      setAccentColor: state.setAccentColor,
      setFontSize: state.setFontSize,
    })));

  const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun; preview: string }[] = [
    { value: "light", label: "Light", icon: Sun, preview: "bg-white border-[#E5E7EB]" },
    { value: "dark", label: "Dark", icon: Moon, preview: "bg-[#111] border-[#333]" },
    { value: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-br from-white to-[#111] border-[#DDD]" },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Customize how Discentia looks and feels.</p>
      </div>

      {/* Theme */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-border bg-card hover:bg-muted/60"
                }`}
              >
                <div className={`w-full h-12 rounded-lg border ${opt.preview}`} />
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={isSelected ? "text-[var(--brand)]" : "text-muted-foreground"} />
                  <span className={`text-xs font-medium ${isSelected ? "text-[var(--brand)]" : "text-foreground/80"}`}>
                    {opt.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check size={9} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Accent Color</h3>
        <p className="mb-3 text-xs text-muted-foreground">Used for highlights and interactive elements.</p>
        <div className="flex items-center gap-2.5">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => setAccentColor(color.hex)}
              title={color.label}
              className={`relative h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110 focus:outline-none ${
                accentColor === color.hex ? "ring-2 ring-offset-2 ring-[var(--brand-ring)] ring-offset-background" : ""
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {accentColor === color.hex && (
                <Check size={14} className="absolute inset-0 m-auto text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Font Size</h3>
        <p className="mb-3 text-xs text-muted-foreground">Adjusts the text size across the app.</p>
        <div className="flex items-center gap-2">
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors capitalize ${
                fontSize === size
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/80 hover:border-foreground/30"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex items-center justify-between border-t border-border py-4">
        <div>
          <p className="text-sm font-medium text-foreground">Collapse sidebar by default</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Start the app with the sidebar collapsed.</p>
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
            sidebarCollapsed ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform dark:bg-background ${
              sidebarCollapsed ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ── Study Section ──

const DAILY_GOAL_OPTIONS = [5, 10, 20, 30, 50];

function StudySection() {
  const [dailyGoal, setDailyGoal] = useState(() => {
    if (typeof window === "undefined") return 20;
    return Number(localStorage.getItem("discentia_daily_goal") ?? 20);
  });
  const [newCardsPerDay, setNewCardsPerDay] = useState(() => {
    if (typeof window === "undefined") return 10;
    return Number(localStorage.getItem("discentia_new_cards_per_day") ?? 10);
  });

  const handleGoal = (value: number) => {
    setDailyGoal(value);
    localStorage.setItem("discentia_daily_goal", String(value));
  };

  const handleNewCards = (value: number) => {
    const clamped = Math.max(1, Math.min(200, value));
    setNewCardsPerDay(clamped);
    localStorage.setItem("discentia_new_cards_per_day", String(clamped));
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Study Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure your daily study goals and review settings.</p>
      </div>

      {/* Daily Goal */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-foreground">Daily Goal</h3>
        <p className="mb-3 text-xs text-muted-foreground">Target number of cards to review per day.</p>
        <div className="flex items-center gap-2">
          {DAILY_GOAL_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleGoal(opt)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                dailyGoal === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/80 hover:border-foreground/30"
              }`}
            >
              {opt} cards
            </button>
          ))}
        </div>
      </div>

      {/* SRS */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Spaced Repetition (SRS)</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm text-foreground">Algorithm</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Scheduling algorithm for reviews.</p>
            </div>
            <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground/80">
              SM-2
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm text-foreground">New cards per day</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Maximum new cards introduced daily.</p>
            </div>
            <input
              type="number"
              value={newCardsPerDay}
              onChange={(e) => handleNewCards(Number(e.target.value))}
              min={1}
              max={200}
              className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm font-medium text-foreground focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data & Privacy Section ──

function DataPrivacySection() {
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then((est) => {
        setStorageInfo({
          used: est.usage ?? 0,
          quota: est.quota ?? 0,
        });
      });
    }
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const db = getDB();
      const [conversations, messages, libraries, libraryItems, exercises, srsCards, activityEvents] =
        await Promise.all([
          db.conversations.toArray(),
          db.messages.toArray(),
          db.libraries.toArray(),
          db.libraryItems.toArray(),
          db.exercises.toArray(),
          db.srsCards.toArray(),
          db.activityEvents.toArray(),
        ]);

      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        conversations,
        messages,
        libraries,
        libraryItems,
        exercises,
        srsCards,
        activityEvents,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `discentia-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.conversations) {
        alert("Invalid backup file.");
        return;
      }

      const db = getDB();
      await db.transaction("rw", [
        db.conversations, db.messages, db.libraries, db.libraryItems,
        db.exercises, db.srsCards, db.activityEvents,
      ], async () => {
        if (data.conversations?.length) await db.conversations.bulkPut(data.conversations);
        if (data.messages?.length) await db.messages.bulkPut(data.messages);
        if (data.libraries?.length) await db.libraries.bulkPut(data.libraries);
        if (data.libraryItems?.length) await db.libraryItems.bulkPut(data.libraryItems);
        if (data.exercises?.length) await db.exercises.bulkPut(data.exercises);
        if (data.srsCards?.length) await db.srsCards.bulkPut(data.srsCards);
        if (data.activityEvents?.length) await db.activityEvents.bulkPut(data.activityEvents);
      });

      alert("Import successful! Refresh the page to see your data.");
    } catch {
      alert("Failed to import backup. Make sure the file is valid.");
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  };

  const handleDeleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      const db = getDB();
      await Promise.all([
        db.conversations.clear(),
        db.messages.clear(),
        db.libraries.clear(),
        db.libraryItems.clear(),
        db.exercises.clear(),
        db.srsCards.clear(),
        db.activityEvents.clear(),
      ]);
      const keysToRemove = Object.keys(localStorage).filter(
        (k) => k.startsWith("discentia_") || k.startsWith("discentia:")
      );
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      setConfirmDelete(false);
      alert("All data deleted. The page will refresh.");
      window.location.reload();
    } finally {
      setDeleting(false);
    }
  };

  const handleResetOnboarding = () => {
    setResettingOnboarding(true);
    try {
      localStorage.removeItem("discentia_onboarded");
      alert("Onboarding reset. The page will refresh.");
      window.location.reload();
    } finally {
      setResettingOnboarding(false);
    }
  };

  const usedPct = storageInfo
    ? Math.min(100, (storageInfo.used / storageInfo.quota) * 100)
    : 0;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Data & Privacy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your local data, export backups, and control privacy settings.
        </p>
      </div>

      {/* Storage */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Storage</h3>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total storage used</span>
            {storageInfo && (
              <span className="text-xs font-medium text-foreground/80">
                {formatBytes(storageInfo.used)}
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          {storageInfo && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {formatBytes(storageInfo.used)} of {formatBytes(storageInfo.quota)} used
            </p>
          )}
        </div>
      </div>

      {/* Export & Import */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Export & Backup</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export all data (JSON)
          </button>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Import backup
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Onboarding</h3>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <p className="text-sm font-medium text-foreground">Reset onboarding</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Clears the onboarding flag and shows the welcome flow again after reload.
            </p>
          </div>
          <button
            onClick={handleResetOnboarding}
            disabled={resettingOnboarding}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
          >
            {resettingOnboarding ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RotateCcw size={14} />
            )}
            Reset onboarding
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
        <div className="border border-red-100 bg-red-50/50 rounded-xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#111]">Delete all data</p>
              <p className="text-xs text-[#888] mt-0.5">
                Permanently removes all libraries, notes, conversations, and progress.
              </p>
            </div>
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50 ${
                confirmDelete
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
              }`}
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {confirmDelete ? "Confirm delete" : "Delete all"}
            </button>
          </div>
          {confirmDelete && (
            <p className="text-xs text-red-600 mt-3">
              Click again to confirm. This action cannot be undone.{" "}
              <button
                onClick={() => setConfirmDelete(false)}
                className="underline cursor-pointer"
              >
                Cancel
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shortcuts Section ──

function ShortcutsSection() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick reference for all keyboard shortcuts available in Discentia.
        </p>
      </div>

      {Object.entries(SHORTCUTS).map(([group, items]) => (
        <div key={group}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group}
          </h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
            {items.map((shortcut) => (
              <div key={shortcut.action} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-foreground">{shortcut.action}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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
    <div className="flex h-full w-full bg-background text-foreground">
      {/* Left nav */}
      <nav className="flex w-52 shrink-0 flex-col border-r border-border bg-card px-3 py-8">
        <h1 className="mb-6 px-3 text-lg font-bold text-foreground">Settings</h1>
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
                    ? "bg-muted text-foreground font-medium cursor-pointer"
                    : "text-muted-foreground hover:bg-muted/60 cursor-pointer"
                }`}
              >
                <Icon size={16} className={isActive ? "text-foreground" : "text-muted-foreground"} />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="mt-auto border-t border-border px-3 pt-4">
          <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            This build runs local-first. No Discentia account or external sync is required.
          </p>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-auto px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "providers" && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">AI Providers</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Configure your AI providers. API keys are encrypted and stored locally on your device.
                  </p>
                </div>
                <div className="space-y-3">
                  {providerDisplays.map((display) => (
                    <ProviderRow key={display.type} display={display} />
                  ))}
                </div>
              </div>
            )}
            {activeSection === "appearance" && <AppearanceSection />}
            {activeSection === "study" && <StudySection />}
            {activeSection === "privacy" && <DataPrivacySection />}
            {activeSection === "shortcuts" && <ShortcutsSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
