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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col"
    >
      {/* Doc label */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-[#A8A5A0] truncate mb-3">
        {documentTitle}
      </p>

      {/* Display title */}
      <h2 className="text-[44px] font-bold leading-none text-[#0C0C0C] tracking-tight">
        Generate
      </h2>
      <h2 className="text-[44px] font-bold leading-none text-[#0C0C0C] tracking-tight mb-7">
        Flashcards
      </h2>

      {/* Focus prompt */}
      <Textarea
        value={focusPrompt}
        onChange={(e) => setFocusPrompt(e.target.value)}
        rows={3}
        placeholder="What should these cards focus on?"
        className="rounded-lg bg-[#F8F8F7] border-[#E4E3E1] focus-visible:ring-[#A8A5A0] resize-none mb-6"
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
        className="w-full h-11 rounded-lg bg-[#171614] hover:bg-[#252422] text-white text-sm font-medium cursor-pointer"
      >
        Generate {cardCount} Flashcards
      </Button>
    </motion.div>
  );
}
