"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGenerationStore } from "@/stores/generation.store";
import FlashcardSlide from "./FlashcardSlide";

interface ReviewStepProps {
  onSave: () => void;
  onRegenerate: () => void;
  onBackToSettings: () => void;
  saving: boolean;
}

export default function ReviewStep({
  onSave,
  onRegenerate,
  onBackToSettings,
  saving,
}: ReviewStepProps) {
  const {
    generatedCards,
    removedCardIds,
    editingCardId,
    setEditingCard,
    updateCard,
    removeCard,
  } = useGenerationStore();

  const activeCards = useMemo(
    () => generatedCards.filter((c) => !removedCardIds.has(c.id)),
    [generatedCards, removedCardIds]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    const timeout = window.setTimeout(onSelect, 0);
    return () => {
      window.clearTimeout(timeout);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Re-init embla when cards change
  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, activeCards.length]);

  const currentCard = activeCards[selectedIndex];
  const isEditing = editingCardId !== null;

  const handleRemove = () => {
    if (!currentCard) return;
    removeCard(currentCard.id);
  };

  if (activeCards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center py-12 text-center"
      >
        <p className="text-sm text-[#7C7974] mb-4">All cards removed</p>
        <Button
          onClick={onRegenerate}
          variant="outline"
          size="sm"
          className="cursor-pointer"
        >
          <Sparkles size={14} className="mr-1.5" />
          Regenerate
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.12, ease: [0.55, 0, 1, 0.45] } }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col min-w-0"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[36px] font-bold leading-none text-[#0C0C0C] tracking-tight">
            Review
          </h2>
          <h2 className="text-[36px] font-bold leading-none text-[#D3D1CE] tracking-tight">
            {activeCards.length} cards
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[36px] font-bold leading-none text-[#0C0C0C] tracking-tight">
            {selectedIndex + 1}
          </p>
          <p className="text-xs text-[#A8A5A0]">/ {activeCards.length}</p>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative mb-4">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex" style={{ paddingLeft: "calc(50% - 148px)", paddingRight: "calc(50% - 148px)" }}>
            {activeCards.map((card, index) => (
              <div
                key={card.id}
                className="flex-shrink-0 w-[296px] px-2 transition-[opacity,transform] duration-200"
                style={{
                  opacity: index === selectedIndex ? 1 : 0.5,
                  transform: index === selectedIndex ? "scale(1)" : "scale(0.92)",
                }}
              >
                <FlashcardSlide
                  card={card}
                  isEditing={editingCardId === card.id}
                  onEdit={() => setEditingCard(card.id)}
                  onSaveEdit={(front, back) => updateCard(card.id, front, back)}
                  onCancelEdit={() => setEditingCard(null)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Nav arrows */}
        {!isEditing && canScrollPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous card"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#E4E3E1] shadow-sm flex items-center justify-center text-[#7C7974] hover:text-[#3D3B38] transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {!isEditing && canScrollNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next card"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#E4E3E1] shadow-sm flex items-center justify-center text-[#7C7974] hover:text-[#3D3B38] transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Dots + counter */}
      {!isEditing && (
        <div className="flex flex-col items-center gap-1.5 mb-4">
          <div className="flex items-center">
            {activeCards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to card ${index + 1}`}
                className="flex items-center justify-center w-8 h-8 cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-full transition-[transform,background-color] duration-150 ${
                    index === selectedIndex
                      ? "bg-[#3D3B38] scale-110"
                      : "bg-[#D3D1CE] hover:bg-[#A8A5A0]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      {!isEditing && (
        <>
          <Separator className="mb-4" />

          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => currentCard && setEditingCard(currentCard.id)}
              className="text-xs text-[#7C7974] cursor-pointer"
            >
              <Pencil size={13} className="mr-1.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-xs text-[#7C7974] hover:text-red-600 cursor-pointer"
            >
              <X size={13} className="mr-1.5" />
              Remove
            </Button>
          </div>

          <Separator className="mb-4" />

          {/* Primary CTA */}
          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full h-11 rounded-lg bg-gradient-to-b from-[#222018] to-[#171614] hover:brightness-110 text-white text-sm font-medium cursor-pointer shadow-[0_0_0_0.5px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)] [text-shadow:0_1px_1px_rgba(0,0,0,0.2)]"
          >
            {saving ? "Saving..." : `Add ${activeCards.length} card${activeCards.length !== 1 ? "s" : ""} to deck`}
          </Button>

          {/* Secondary actions */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={onRegenerate}
              className="text-xs text-[#A8A5A0] hover:text-[#5C5A56] transition-colors cursor-pointer"
            >
              Regenerate
            </button>
            <span className="text-xs text-[#D3D1CE]">·</span>
            <button
              onClick={onBackToSettings}
              className="text-xs text-[#A8A5A0] hover:text-[#5C5A56] transition-colors cursor-pointer"
            >
              Back to settings
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
