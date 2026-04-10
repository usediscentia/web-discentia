"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardSelector } from "@/components/ui/card-selector";
import { useGenerationStore } from "@/stores/generation.store";
import { useProviderStore } from "@/stores/provider.store";
import { PROVIDER_DEFAULTS } from "@/types/ai";

interface ConfigureStepProps {
  onGenerate: () => void;
}

export default function ConfigureStep({ onGenerate }: ConfigureStepProps) {
  const { documentTitle, focusPrompt, cardCount, setFocusPrompt, setCardCount } =
    useGenerationStore();

  const { selectedProvider, providerConfigs } = useProviderStore();
  const requiresKey = PROVIDER_DEFAULTS[selectedProvider].requiresApiKey;
  const hasKey = Boolean(providerConfigs[selectedProvider]?.apiKey);
  const needsSetup = requiresKey && !hasKey;

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
        Generate<br />Flashcards
      </h2>

      {/* Focus prompt */}
      <Textarea
        value={focusPrompt}
        onChange={(e) => setFocusPrompt(e.target.value)}
        rows={3}
        placeholder="What should these cards focus on?"
        className="rounded-lg bg-[#F8F8F7] border-[#E4E3E1] focus-visible:ring-ring resize-none mb-6"
      />

      {/* API key warning — between textarea and card count */}
      {needsSetup && (
        <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          No API key configured for {PROVIDER_DEFAULTS[selectedProvider].displayName}.
          Set it up in Settings first.
        </div>
      )}

      {/* Card count */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-[#A8A5A0] mb-3">
        How many cards
      </p>
      <CardSelector
        selectedAmount={cardCount}
        onSelect={setCardCount}
        className="mb-7"
      />

      {/* CTA */}
      <Button
        onClick={onGenerate}
        disabled={needsSetup}
        className="w-full h-11 rounded-lg bg-gradient-to-b from-[#222018] to-[#171614] hover:brightness-110 active:scale-[0.97] text-white text-sm font-medium cursor-pointer shadow-[0_0_0_0.5px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)]"
        style={{ transition: "filter 150ms ease, transform 150ms ease" }}
      >
        Generate {cardCount} Flashcards
      </Button>
    </motion.div>
  );
}
