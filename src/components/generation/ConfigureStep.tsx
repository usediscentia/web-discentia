"use client";

import { Sparkles, Layers } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useGenerationStore } from "@/stores/generation.store";
import { useProviderStore } from "@/stores/provider.store";
import { PROVIDER_DEFAULTS } from "@/types/ai";

const COUNT_OPTIONS = [4, 8, 12, 16] as const;

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
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center"
    >
      {/* Icon + Title */}
      <div className="w-12 h-12 rounded-xl bg-[#F1F0EF] flex items-center justify-center mb-3">
        <Layers size={22} className="text-[#3D3B38]" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-[#0C0C0C] text-center">
        Generate Flashcards
      </h2>
      <p className="text-sm text-[#7C7974] text-center mt-1 mb-5 max-w-sm truncate px-4">
        From &ldquo;{documentTitle}&rdquo;
      </p>

      <Separator className="mb-5" />

      {needsSetup && (
        <div className="w-full mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          No API key configured for {PROVIDER_DEFAULTS[selectedProvider].displayName}.
          Set it up in Settings first.
        </div>
      )}

      {/* Focus prompt */}
      <div className="w-full mb-5">
        <label className="block text-sm font-medium text-[#3D3B38] mb-2">
          What should the cards focus on?
        </label>
        <Textarea
          value={focusPrompt}
          onChange={(e) => setFocusPrompt(e.target.value)}
          rows={3}
          placeholder="Generate flashcards about the key concepts in this document"
          className="rounded-lg bg-[#F8F8F7] border-[#E4E3E1] focus-visible:ring-[#A8A5A0] resize-none"
        />
      </div>

      {/* Card count */}
      <div className="w-full mb-6">
        <label className="block text-sm font-medium text-[#3D3B38] mb-2">
          How many cards?
        </label>
        <div className="flex gap-2">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setCardCount(n)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                cardCount === n
                  ? "bg-[#171614] text-white border-[#171614]"
                  : "border-[#E4E3E1] text-[#5C5A56] hover:bg-[#F8F8F7]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={onGenerate}
        disabled={needsSetup}
        className="w-full h-11 rounded-lg bg-[#171614] hover:bg-[#252422] text-white text-sm font-medium cursor-pointer"
      >
        <Sparkles size={14} className="mr-2" />
        Generate {cardCount} Flashcards
      </Button>
    </motion.div>
  );
}
