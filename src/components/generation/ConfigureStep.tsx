"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ProviderIcon } from "@lobehub/icons";
import { Layers, BrainCircuit, Zap, Link2, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardSelector } from "@/components/ui/card-selector";
import { AIProviderSelector } from "@/components/providers/AIProviderSelector";
import { useGenerationStore } from "@/stores/generation.store";
import type { ExerciseGenerationType } from "@/stores/generation.store";
import { useProviderStore } from "@/stores/provider.store";
import { PROVIDER_DEFAULTS } from "@/types/ai";
import type { AIProviderType } from "@/types/ai";

const LOBE_PROVIDER_MAP: Record<AIProviderType, string> = {
  openai: "openai",
  anthropic: "anthropic",
  ollama: "ollama",
  "lm-studio": "lmstudio",
  openrouter: "openrouter",
  "github-copilot": "github",
};

function formatModelName(model: string): string {
  const slashIdx = model.indexOf("/");
  const name = slashIdx !== -1 ? model.slice(slashIdx + 1) : model;
  return name.length > 28 ? name.slice(0, 26) + "…" : name;
}

const TYPE_OPTIONS: { type: ExerciseGenerationType; label: string; icon: React.ReactNode }[] = [
  { type: "flashcard", label: "Flashcards", icon: <Layers size={13} /> },
  { type: "quiz", label: "Quiz", icon: <BrainCircuit size={13} /> },
  { type: "sprint", label: "Sprint", icon: <Zap size={13} /> },
  { type: "connections", label: "Connections", icon: <Link2 size={13} /> },
  { type: "fillgap", label: "Fill Gap", icon: <AlignLeft size={13} /> },
];

const HEADING_MAP: Record<ExerciseGenerationType, string> = {
  flashcard: "Flashcards",
  quiz: "Quiz",
  sprint: "Sprint",
  connections: "Connections",
  fillgap: "Fill Gap",
};

const SUPPORTS_COUNT: Record<ExerciseGenerationType, boolean> = {
  flashcard: true,
  quiz: true,
  sprint: true,
  connections: false,
  fillgap: false,
};

function ctaLabel(type: ExerciseGenerationType, count: number): string {
  switch (type) {
    case "flashcard": return `Generate ${count} Flashcards`;
    case "quiz": return `Generate ${count} Questions`;
    case "sprint": return `Generate ${count} Questions`;
    case "connections": return "Generate Connections";
    case "fillgap": return "Generate Fill Gap";
  }
}

interface ConfigureStepProps {
  onGenerate: () => void;
}

export default function ConfigureStep({ onGenerate }: ConfigureStepProps) {
  const {
    documentTitle,
    focusPrompt,
    cardCount,
    exerciseType,
    setFocusPrompt,
    setCardCount,
    setExerciseType,
  } = useGenerationStore();

  const { selectedProvider, selectedModel, providerConfigs } = useProviderStore();
  const requiresKey = PROVIDER_DEFAULTS[selectedProvider].requiresApiKey;
  const hasKey = Boolean(providerConfigs[selectedProvider]?.apiKey);
  const needsSetup = requiresKey && !hasKey;
  const [showSelector, setShowSelector] = useState(false);

  const displayTitle = documentTitle
    .replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_?/i, "")
    .replace(/\.[a-z0-9]{2,6}$/i, "")
    .replace(/_+/g, " ")
    .trim() || documentTitle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.12, ease: [0.55, 0, 1, 0.45] } }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col"
    >
      {/* Doc label */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-[#A8A5A0] truncate mb-3">
        {displayTitle}
      </p>

      {/* Display title */}
      <h2 className="text-[44px] font-bold leading-none text-[#0C0C0C] tracking-tight mb-7">
        Generate<br />{HEADING_MAP[exerciseType]}
      </h2>

      {/* Type selector */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-[#A8A5A0] mb-3">
        Type
      </p>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TYPE_OPTIONS.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => setExerciseType(type)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
              exerciseType === type
                ? "bg-foreground text-background border-transparent"
                : "bg-[#F8F8F7] text-[#5C5A56] border-[#E4E3E1] hover:bg-[#F1F0EF]"
            }`}
            style={{ transition: "background-color 120ms ease, color 120ms ease, border-color 120ms ease" }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Focus prompt */}
      <Textarea
        value={focusPrompt}
        onChange={(e) => setFocusPrompt(e.target.value)}
        rows={3}
        placeholder="What should this exercise focus on?"
        className="rounded-lg bg-[#F8F8F7] border-[#E4E3E1] focus-visible:ring-ring resize-none mb-6"
      />

      {/* API key warning */}
      {needsSetup && (
        <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          No API key configured for {PROVIDER_DEFAULTS[selectedProvider].displayName}.
          Set it up in Settings first.
        </div>
      )}

      {/* Card count — hidden for types that don't use it */}
      {SUPPORTS_COUNT[exerciseType] && (
        <>
          <p className="text-[10px] font-medium tracking-widest uppercase text-[#A8A5A0] mb-3">
            {exerciseType === "flashcard" ? "How many cards" : "How many questions"}
          </p>
          <CardSelector
            selectedAmount={cardCount}
            onSelect={setCardCount}
            className="mb-7"
          />
        </>
      )}

      {/* Spacer when CardSelector is hidden */}
      {!SUPPORTS_COUNT[exerciseType] && <div className="mb-7" />}

      {/* Provider selector */}
      <AIProviderSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        positionClassName="fixed z-[60]"
        panelStyle={{ left: "calc(50% + 240px)", top: "calc(50% - 270px)" }}
        backdropClassName="fixed inset-0 z-[55]"
        originY={0}
        enterFrom="right"
      />

      {/* CTA */}
      <Button
        onClick={onGenerate}
        disabled={needsSetup}
        className="w-full h-11 rounded-lg hover:brightness-110 active:scale-[0.97] text-sm font-medium cursor-pointer shadow-[0_0_0_0.5px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)]"
        style={{ transition: "filter 150ms ease, transform 150ms ease", backgroundColor: "var(--brand)", color: "var(--brand-foreground)" }}
      >
        {ctaLabel(exerciseType, cardCount)}
      </Button>

      {/* Model attribution */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <ProviderIcon provider={LOBE_PROVIDER_MAP[selectedProvider]} size={12} type="color" />
        <span className="text-[11px] text-[#A8A5A0] leading-none">
          {formatModelName(selectedModel)}
        </span>
        <span className="text-[11px] text-[#D3D1CE] leading-none">·</span>
        <button
          onClick={() => setShowSelector((v) => !v)}
          className="text-[11px] text-[#A8A5A0] hover:text-[#5C5A56] transition-colors cursor-pointer leading-none"
        >
          Change
        </button>
      </div>
    </motion.div>
  );
}
