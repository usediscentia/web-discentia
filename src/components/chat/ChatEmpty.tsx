"use client";

import { motion } from "motion/react";
import {
  Square3Stack3DIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { ProviderIcon } from "@lobehub/icons";
import { ChevronRight, KeyRound } from "lucide-react";
import { DiscentiaLogo } from "@/components/brand/DiscentiaLogo";
import { useProviderStore } from "@/stores/provider.store";
import { useAppStore } from "@/stores/app.store";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import type { AIProviderType } from "@/types/ai";

interface ChatEmptyProps {
  onPromptClick?: (prompt: string) => void;
}

const providerCards: Array<{
  id: AIProviderType;
  name: string;
  lobeProvider: string;
  description: string;
  tag: string;
}> = [
  {
    id: "openai",
    name: "OpenAI",
    lobeProvider: "openai",
    description: "GPT-4o and more",
    tag: "API Key",
  },
  {
    id: "ollama",
    name: "Ollama",
    lobeProvider: "ollama",
    description: "Run models locally",
    tag: "Local",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    lobeProvider: "openrouter",
    description: "Access multiple providers",
    tag: "Multi-model",
  },
];

function SetupCard() {
  const { setSettingsOpen } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 w-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1A1A1A]">
          <DiscentiaLogo size={28} alt="Discentia" />
        </div>
        <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-[-0.5px]">
          Welcome to Discentia
        </h1>
        <p className="text-[14px] text-[#9CA3AF] text-center max-w-[340px] leading-relaxed">
          Connect an AI provider to start chatting, generating flashcards, and reviewing with spaced repetition.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-stretch gap-3"
      >
        {providerCards.map((provider, i) => (
          <motion.button
            key={provider.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            transition={{
              duration: 0.35,
              delay: 0.15 + i * 0.06,
              ease: [0.23, 1, 0.32, 1],
            }}
            onClick={() => setSettingsOpen(true)}
            className="group flex flex-col items-center gap-3 w-[160px] p-5 rounded-2xl border border-[#E5E7EB] bg-white cursor-pointer [transition:border-color_150ms_ease-out,box-shadow_200ms_ease-out] hover:border-[#D1D5DB] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F9FAFB] group-hover:bg-[#F3F4F6] transition-colors">
              <ProviderIcon provider={provider.lobeProvider} size={22} type="color" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">
                {provider.name}
              </span>
              <span className="text-[12px] text-[#9CA3AF] leading-snug text-center">
                {provider.description}
              </span>
            </div>
            <span className="text-[10px] font-medium text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
              {provider.tag}
            </span>
          </motion.button>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-[12px] text-[#C4C4C4] flex items-center gap-1.5"
      >
        <KeyRound size={11} />
        API keys are encrypted and stored locally on your device
      </motion.p>
    </div>
  );
}

export function ChatEmpty({ onPromptClick }: ChatEmptyProps) {
  const providerConfigs = useProviderStore((s) => s.providerConfigs);
  const ollamaStatus = useProviderStore((s) => s.ollamaStatus);

  const isConfigured = (() => {
    for (const [type, config] of Object.entries(providerConfigs)) {
      if (type === "ollama") {
        if (ollamaStatus === "connected") return true;
        continue;
      }
      if (PROVIDER_DEFAULTS[type as AIProviderType]?.requiresApiKey && config.apiKey) {
        return true;
      }
    }
    return false;
  })();

  if (!isConfigured) {
    return <SetupCard />;
  }

  const prompts = [
    {
      icon: Square3Stack3DIcon,
      text: "Generate flashcards about...",
    },
    {
      icon: QuestionMarkCircleIcon,
      text: "Create a quiz on...",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-9 w-full px-4">
      {/* Mark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#111] shadow-sm"
      >
        <DiscentiaLogo size={26} alt="Discentia" />
      </motion.div>

      {/* Headline */}
      <div className="flex flex-col items-center gap-1 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
          className="block text-[34px] font-semibold text-[#0F0F0F] tracking-[-0.9px] leading-[1.1]"
        >
          Start learning.
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.09, ease: [0.23, 1, 0.32, 1] }}
          className="block text-[34px] font-normal text-[#C8C8C8] tracking-[-0.9px] leading-[1.1]"
        >
          Ask anything.
        </motion.span>
      </div>

      {/* Action rows */}
      <div className="flex flex-col gap-2 w-full max-w-[300px]">
        {prompts.map((prompt, i) => (
          <motion.button
            key={prompt.text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.14 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPromptClick?.(prompt.text)}
            className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white border border-[#E8E8E8] cursor-pointer text-left"
            style={{ transition: "border-color 140ms ease-out, background-color 140ms ease-out" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#D0D0D0"; (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAFA"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E8E8E8"; (e.currentTarget as HTMLElement).style.backgroundColor = "white"; }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
              style={{ background: "var(--brand-soft)" }}
            >
              <prompt.icon className="w-[14px] h-[14px]" style={{ color: "var(--brand)" }} />
            </div>
            <span className="text-[13px] font-medium text-[#3A3A3A] flex-1">
              {prompt.text}
            </span>
            <ChevronRight
              size={13}
              className="shrink-0 text-[#D4D4D4]"
              style={{ transition: "color 140ms ease-out, transform 140ms ease-out" }}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
