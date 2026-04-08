"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  BookOpen,
  Zap,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { ProviderIcon } from "@lobehub/icons";
import { DiscentiaLogo } from "@/components/brand/DiscentiaLogo";
import { useProviderStore } from "@/stores/provider.store";
import { StorageService } from "@/services/storage";
import { LIBRARY_COLORS } from "@/lib/colors";
import type { AIProviderType } from "@/types/ai";

const ONBOARDED_KEY = "discentia_onboarded";
const TOTAL_STEPS = 4;

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleFinish = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, "1");
    onComplete();
  }, [onComplete]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white">
      {/* Main content card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] mx-4"
      >
        <div className="mb-4 flex items-center justify-center gap-2.5">
          <DiscentiaLogo size={22} alt="Discentia" />
          <span
            className="text-[17px] font-bold text-[#0a0a0a]"
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Discentia
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 28 : 8,
                backgroundColor: i <= step ? "#0a0a0a" : "rgba(0,0,0,0.15)",
              }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden min-h-[480px] flex flex-col border border-black/[0.06]">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <StepWelcome
                key="welcome"
                variants={variants}
                direction={direction}
                onNext={goNext}
              />
            )}
            {step === 1 && (
              <StepProvider
                key="provider"
                variants={variants}
                direction={direction}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 2 && (
              <StepLibrary
                key="library"
                variants={variants}
                direction={direction}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 3 && (
              <StepReady
                key="ready"
                variants={variants}
                direction={direction}
                onFinish={handleFinish}
                onBack={goBack}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  );
}

/* ─── Shared types ─── */

import type { Variants } from "motion/react";

interface StepProps {
  variants: Variants;
  direction: number;
}

/* ─── Step 1: Welcome ─── */

function StepWelcome({
  variants,
  direction,
  onNext,
}: StepProps & { onNext: () => void }) {
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1"
    >
      {/* Hero area */}
      <div className="relative px-10 pt-12 pb-8">

        {/* Display headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a]"
        >
          Learn.
          <br />
          Retain.
          <br />
          <span className="text-[#0a0a0a]/25">Repeat.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="relative mt-4 text-[13px] text-[#6B7280] leading-relaxed max-w-[240px]"
        >
          AI exercises, flashcards, and spaced repetition — all in your browser.
        </motion.p>
      </div>

      {/* Feature badges */}
      <div className="flex flex-col flex-1 px-10 py-6 gap-2.5">
        {[
          {
            icon: Sparkles,
            label: "AI Exercises",
            sub: "Flashcards & quizzes",
            color: "#818CF8",
          },
          {
            icon: BookOpen,
            label: "Smart Library",
            sub: "PDFs, text & notes",
            color: "#34D399",
          },
          {
            icon: Zap,
            label: "Spaced Repetition",
            sub: "SM-2 algorithm",
            color: "#FBBF24",
          },
        ].map((feat, i) => (
          <motion.span
            key={feat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.09, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center self-start gap-x-2.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5"
          >
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0a0a0a]">
              <feat.icon size={12} style={{ color: feat.color }} />
              {feat.label}
            </span>
            <span className="h-3.5 w-px bg-[#E5E7EB]" />
            <span className="text-[12px] text-[#9CA3AF]">{feat.sub}</span>
          </motion.span>
        ))}
      </div>

      <div className="px-10 pb-8">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.35 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0a0a0a] text-white text-[14px] font-semibold cursor-pointer shadow-md shadow-black/10 hover:bg-[#1a1a1a] transition-colors"
        >
          Get Started
          <ArrowRight size={15} />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Step 2: Connect AI Provider ─── */

interface ProviderOption {
  type: AIProviderType;
  lobeKey: string;
  label: string;
  description: string;
  requiresApiKey: boolean;
}

const PROVIDERS: ProviderOption[] = [
  {
    type: "ollama",
    lobeKey: "ollama",
    label: "Ollama",
    description: "Free, local AI. No API key needed.",
    requiresApiKey: false,
  },
  {
    type: "openai",
    lobeKey: "openai",
    label: "OpenAI",
    description: "GPT-4o, GPT-4o-mini",
    requiresApiKey: true,
  },
  {
    type: "anthropic",
    lobeKey: "anthropic",
    label: "Claude",
    description: "Claude 3.5 Sonnet, Claude 3 Haiku",
    requiresApiKey: true,
  },
  {
    type: "openrouter",
    lobeKey: "openrouter",
    label: "OpenRouter",
    description: "Access 100+ models with one key",
    requiresApiKey: true,
  },
];

function StepProvider({
  variants,
  direction,
  onNext,
  onBack,
}: StepProps & { onNext: () => void; onBack: () => void }) {
  const {
    setSelectedProvider,
    setProviderConfig,
    saveProviderConfig,
    checkOllamaConnection,
    ollamaStatus,
    providerConfigs,
  } = useProviderStore();

  const [selected, setSelected] = useState<AIProviderType | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [ollamaChecking, setOllamaChecking] = useState(false);

  // Auto-detect Ollama on mount
  useEffect(() => {
    const startTimeout = window.setTimeout(() => setOllamaChecking(true), 0);
    checkOllamaConnection().finally(() => setOllamaChecking(false));
    return () => window.clearTimeout(startTimeout);
  }, [checkOllamaConnection]);

  const handleSelectProvider = useCallback(
    (type: AIProviderType) => {
      setSelected(type);
      const provider = PROVIDERS.find((p) => p.type === type);
      if (provider && !provider.requiresApiKey) {
        setApiKey("");
      } else {
        setApiKey(providerConfigs[type]?.apiKey || "");
      }
    },
    [providerConfigs]
  );

  const handleContinue = useCallback(async () => {
    if (!selected) return;

    const provider = PROVIDERS.find((p) => p.type === selected);
    if (provider?.requiresApiKey && !apiKey.trim()) return;

    setSelectedProvider(selected);
    if (provider?.requiresApiKey && apiKey.trim()) {
      setProviderConfig(selected, {
        apiKey: apiKey.trim(),
        model: providerConfigs[selected].model,
      });
      await saveProviderConfig(selected, apiKey.trim());
    }
    onNext();
  }, [
    selected,
    apiKey,
    setSelectedProvider,
    setProviderConfig,
    saveProviderConfig,
    providerConfigs,
    onNext,
  ]);

  const canContinue =
    selected &&
    (!PROVIDERS.find((p) => p.type === selected)?.requiresApiKey ||
      apiKey.trim());

  const selectedProvider = PROVIDERS.find((p) => p.type === selected);

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1 px-8 py-8"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#0a0a0a]">
          Connect an AI
        </h2>
        <p className="mt-1.5 text-[14px] text-[#6B7280] leading-relaxed">
          Choose your preferred AI provider to power exercises and chat.
        </p>
      </div>

      <div className="mt-6 space-y-2.5">
        {PROVIDERS.map((provider, i) => {
          const isSelected = selected === provider.type;
          const isOllamaConnected =
            provider.type === "ollama" && ollamaStatus === "connected";

          return (
            <motion.button
              key={provider.type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              onClick={() => handleSelectProvider(provider.type)}
              className={`w-full flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer text-left ${
                isSelected
                  ? "border-[#0a0a0a] bg-[#FAFAFA] [transition:border-color_150ms_ease,background-color_150ms_ease]"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#FAFAFA] [transition:border-color_150ms_ease,background-color_150ms_ease]"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center shrink-0 overflow-hidden">
                <ProviderIcon provider={provider.lobeKey} size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#0a0a0a]">
                    {provider.label}
                  </span>
                  {provider.type === "ollama" && !ollamaChecking && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isOllamaConnected
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-400"
                      }`}
                    >
                      {isOllamaConnected ? (
                        <Wifi size={10} />
                      ) : (
                        <WifiOff size={10} />
                      )}
                      {isOllamaConnected ? "Connected" : "Not found"}
                    </span>
                  )}
                  {provider.type === "ollama" && ollamaChecking && (
                    <span className="text-[10px] text-[#9CA3AF] font-medium">
                      Checking...
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                  {provider.description}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "border-[#0a0a0a] bg-[#0a0a0a]"
                    : "border-[#D1D5DB]"
                }`}
              >
                {isSelected && <Check size={12} className="text-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* API key input */}
      <AnimatePresence>
        {selectedProvider?.requiresApiKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <label className="text-[13px] font-medium text-[#374151] block mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${selectedProvider.label} API key`}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-[#E5E7EB] text-[14px] text-[#0a0a0a] outline-none focus:border-[#0a0a0a] transition-colors bg-[#FAFAFA] placeholder:text-[#C0C0C0]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <motion.button
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
            canContinue
              ? "bg-[#0a0a0a] text-white shadow-lg shadow-black/10 hover:bg-[#1a1a1a]"
              : "bg-[#F3F4F6] text-[#C0C0C0] cursor-not-allowed"
          }`}
        >
          Continue
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Step 3: Create First Library ─── */

const TEMPLATES = [
  { name: "Biology", emoji: "🔬", color: "#34D399" },
  { name: "History", emoji: "🏛️", color: "#FBBF24" },
  { name: "Computer Science", emoji: "💻", color: "#818CF8" },
  { name: "Languages", emoji: "🌍", color: "#F87171" },
];

function StepLibrary({
  variants,
  direction,
  onNext,
  onBack,
}: StepProps & { onNext: () => void; onBack: () => void }) {
  const [libraryName, setLibraryName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(LIBRARY_COLORS[0].hex);
  const [creating, setCreating] = useState(false);

  const handleTemplateClick = (template: (typeof TEMPLATES)[number]) => {
    setLibraryName(template.name);
    setSelectedColor(template.color);
  };

  const handleCreate = useCallback(async () => {
    const name = libraryName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await StorageService.createLibrary({
        name,
        color: selectedColor,
      });
      onNext();
    } catch {
      setCreating(false);
    }
  }, [libraryName, selectedColor, onNext]);

  const handleSkip = () => onNext();

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1 px-8 py-8"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
          Step 2
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#0a0a0a]">
          Your first library
        </h2>
        <p className="mt-1 text-[13px] text-[#9CA3AF] leading-relaxed">
          Pick a subject or name one yourself.
        </p>
      </div>

      {/* Templates */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {TEMPLATES.map((template, i) => {
          const isActive = libraryName === template.name;
          return (
            <motion.button
              key={template.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
              onClick={() => handleTemplateClick(template)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 [transition:border-color_150ms_ease,background-color_150ms_ease] cursor-pointer text-center ${
                isActive
                  ? "border-[#0a0a0a] bg-[#FAFAFA]"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#FAFAFA]"
              }`}
            >
              <div
                className="flex h-14 w-14 items-center justify-center shadow-sm"
                style={{ borderRadius: "28%" }}
              >
                <span className="text-[34px] leading-none select-none">{template.emoji}</span>
              </div>
              <span className="text-[12px] font-medium text-[#0a0a0a] leading-tight">
                {template.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Name input */}
      <div className="mt-4">
        <input
          type="text"
          value={libraryName}
          onChange={(e) => setLibraryName(e.target.value)}
          placeholder="Or type a custom name…"
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-[14px] text-[#0a0a0a] outline-none focus:border-[#0a0a0a] transition-colors bg-[#FAFAFA] placeholder:text-[#C0C0C0]"
        />
      </div>

      {/* Book-spine color picker */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF] mb-3">
          Colour
        </p>
        <div className="flex items-end gap-1.5">
          {LIBRARY_COLORS.map((color, i) => {
            const isSelected = selectedColor === color.hex;
            // Vary spine heights for a bookshelf feel
            const heights = [44, 52, 40, 56, 48, 44, 52, 40, 56, 48, 44, 52];
            const h = heights[i % heights.length];
            return (
              <motion.button
                key={color.hex}
                type="button"
                onClick={() => setSelectedColor(color.hex)}
                animate={{
                  y: isSelected ? -4 : 0,
                  opacity: isSelected ? 1 : 0.5,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="relative flex-1 rounded-t-sm rounded-b-[2px] cursor-pointer focus:outline-none"
                style={{
                  height: h,
                  backgroundColor: color.hex,
                }}
                title={color.name}
              >
                {isSelected && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        {/* Shelf baseline */}
        <div className="mt-0 h-[3px] rounded-full bg-[#E5E7EB]" />
      </div>

      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer transition-colors"
          >
            Skip
          </button>
          <motion.button
            whileHover={libraryName.trim() ? { scale: 1.02 } : {}}
            whileTap={libraryName.trim() ? { scale: 0.97 } : {}}
            onClick={handleCreate}
            disabled={!libraryName.trim() || creating}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
              libraryName.trim() && !creating
                ? "bg-[#0a0a0a] text-white shadow-lg shadow-black/10 hover:bg-[#1a1a1a]"
                : "bg-[#F3F4F6] text-[#C0C0C0] cursor-not-allowed"
            }`}
          >
            {creating ? "Creating..." : "Create"}
            {!creating && <ArrowRight size={14} />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Step 4: Ready ─── */

function StepReady({
  variants,
  direction,
  onFinish,
  onBack,
}: StepProps & { onFinish: () => void; onBack: () => void }) {
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center flex-1 px-10 py-12"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.25, delay: 0.1 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.2, delay: 0.22 }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.38, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              <Check size={32} className="text-emerald-600" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>

        {/* Celebration sparkles */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.div
            key={angle}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.6] }}
            transition={{ delay: 0.45 + i * 0.06, duration: 0.6, ease: "easeOut" }}
            className="absolute w-2 h-2 rounded-full bg-emerald-400"
            style={{
              top: `${50 - 55 * Math.cos((angle * Math.PI) / 180)}%`,
              left: `${50 + 55 * Math.sin((angle * Math.PI) / 180)}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="mt-8 text-2xl font-bold tracking-[-0.03em] text-[#0a0a0a]"
      >
        You&apos;re all set!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="mt-2 text-[14px] text-[#6B7280] text-center leading-relaxed max-w-xs"
      >
        Start a conversation, add content to your library, or generate
        exercises. Discentia adapts to how you learn.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center gap-3 mt-8"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onFinish}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0a0a0a] text-white text-[15px] font-semibold cursor-pointer shadow-md shadow-black/10 hover:bg-[#1a1a1a] [transition:background-color_150ms_ease]"
        >
          <Sparkles size={16} />
          Start Learning
        </motion.button>
        <button
          onClick={onBack}
          className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer [transition:color_150ms_ease]"
        >
          Go back
        </button>
      </motion.div>
    </motion.div>
  );
}

export { ONBOARDED_KEY };
