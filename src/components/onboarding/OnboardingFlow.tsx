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
  GraduationCap,
} from "lucide-react";
import { ProviderIcon } from "@lobehub/icons";
import { useProviderStore } from "@/stores/provider.store";
import { StorageService } from "@/services/storage";
import { LIBRARY_COLORS } from "@/lib/colors";
import { OLLAMA_API_URL } from "@/lib/constants";
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
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(129,140,248,0.3) 0%, transparent 70%)",
            animation: "drift 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(52,211,153,0.25) 0%, transparent 70%)",
            animation: "drift 25s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Main content card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[520px] mx-4"
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 28 : 8,
                backgroundColor: i <= step ? "#fff" : "rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden min-h-[480px] flex flex-col">
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

      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.05); }
          50% { transform: translate(-20px, 30px) scale(0.95); }
          75% { transform: translate(15px, 15px) scale(1.02); }
        }
      `}</style>
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
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center flex-1 px-10 py-12"
    >
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.15,
        }}
        className="w-20 h-20 rounded-[22px] bg-[#0a0a0a] flex items-center justify-center shadow-lg shadow-black/20"
      >
        <GraduationCap size={36} className="text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 text-3xl font-bold tracking-[-0.04em] text-[#0a0a0a]"
      >
        discentia
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="mt-3 text-[15px] text-[#6B7280] text-center leading-relaxed max-w-xs"
      >
        Learn anything with AI-powered exercises, flashcards, and spaced
        repetition.
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-2 mt-8"
      >
        {[
          { icon: Sparkles, label: "AI Exercises", color: "#818CF8" },
          { icon: BookOpen, label: "Smart Library", color: "#34D399" },
          { icon: Zap, label: "Spaced Repetition", color: "#FBBF24" },
        ].map((feat) => (
          <span
            key={feat.label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
            style={{
              backgroundColor: `${feat.color}14`,
              color: feat.color,
            }}
          >
            <feat.icon size={13} />
            {feat.label}
          </span>
        ))}
      </motion.div>

      <div className="flex-1" />

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0a0a0a] text-white text-[15px] font-semibold cursor-pointer shadow-lg shadow-black/15 hover:bg-[#1a1a1a] transition-colors"
      >
        Get Started
        <ArrowRight size={16} />
      </motion.button>
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
    saveProviderConfigs,
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
    setOllamaChecking(true);
    checkOllamaConnection().finally(() => setOllamaChecking(false));
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
    }
    await saveProviderConfigs();
    onNext();
  }, [
    selected,
    apiKey,
    setSelectedProvider,
    setProviderConfig,
    saveProviderConfigs,
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
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
          const isOllamaDisconnected =
            provider.type === "ollama" && ollamaStatus === "disconnected";

          return (
            <motion.button
              key={provider.type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              onClick={() => handleSelectProvider(provider.type)}
              className={`w-full flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                isSelected
                  ? "border-[#0a0a0a] bg-[#FAFAFA]"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#FAFAFA]"
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
  { name: "Biology", icon: "🧬", color: "#34D399" },
  { name: "History", icon: "📜", color: "#FBBF24" },
  { name: "Computer Science", icon: "💻", color: "#818CF8" },
  { name: "Languages", icon: "🗣️", color: "#F87171" },
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
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col flex-1 px-8 py-8"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#0a0a0a]">
          Create your first library
        </h2>
        <p className="mt-1.5 text-[14px] text-[#6B7280] leading-relaxed">
          Libraries organize your study materials. Pick a subject to get
          started.
        </p>
      </div>

      {/* Templates */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {TEMPLATES.map((template, i) => (
          <motion.button
            key={template.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
            onClick={() => handleTemplateClick(template)}
            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
              libraryName === template.name
                ? "border-[#0a0a0a] bg-[#FAFAFA]"
                : "border-[#E5E7EB] hover:border-[#D1D5DB]"
            }`}
          >
            <span className="text-lg">{template.icon}</span>
            <span className="text-[13px] font-medium text-[#0a0a0a]">
              {template.name}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Name input */}
      <div className="mt-5">
        <label className="text-[13px] font-medium text-[#374151] block mb-1.5">
          Library name
        </label>
        <input
          type="text"
          value={libraryName}
          onChange={(e) => setLibraryName(e.target.value)}
          placeholder="e.g. Organic Chemistry, French Vocab..."
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-[14px] text-[#0a0a0a] outline-none focus:border-[#0a0a0a] transition-colors bg-[#FAFAFA] placeholder:text-[#C0C0C0]"
        />
      </div>

      {/* Color picker inline */}
      <div className="mt-4">
        <label className="text-[13px] font-medium text-[#374151] block mb-2">
          Color
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {LIBRARY_COLORS.map((color) => {
            const isSelected = selectedColor === color.hex;
            return (
              <button
                key={color.hex}
                type="button"
                onClick={() => setSelectedColor(color.hex)}
                className="w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                style={{
                  backgroundColor: color.hex,
                  boxShadow: isSelected
                    ? `0 0 0 2px white, 0 0 0 3.5px ${color.hex}`
                    : undefined,
                }}
                title={color.name}
              >
                {isSelected && (
                  <Check
                    size={12}
                    className="text-white drop-shadow-sm"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

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
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer transition-colors"
          >
            Skip
          </button>
          <motion.button
            whileHover={libraryName.trim() ? { scale: 1.02 } : {}}
            whileTap={libraryName.trim() ? { scale: 0.98 } : {}}
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
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center flex-1 px-10 py-12"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.3,
            }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
          >
            <motion.div
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Check size={32} className="text-emerald-600" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>

        {/* Celebration sparkles */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.div
            key={angle}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5] }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.8 }}
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-2xl font-bold tracking-[-0.03em] text-[#0a0a0a]"
      >
        You&apos;re all set!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="mt-2 text-[15px] text-[#6B7280] text-center leading-relaxed max-w-xs"
      >
        Start a conversation, add content to your library, or generate
        exercises. Discentia adapts to how you learn.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="flex flex-col items-center gap-3 mt-8"
      >
        <button
          onClick={onFinish}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0a0a0a] text-white text-[15px] font-semibold cursor-pointer shadow-lg shadow-black/15 hover:bg-[#1a1a1a] transition-colors"
        >
          <Sparkles size={16} />
          Start Learning
        </button>
        <button
          onClick={onBack}
          className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer transition-colors"
        >
          Go back
        </button>
      </motion.div>
    </motion.div>
  );
}

export { ONBOARDED_KEY };
