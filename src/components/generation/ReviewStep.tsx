"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, X, Sparkles } from "lucide-react";
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
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
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
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col min-w-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-[#0C0C0C]">
          Review Flashcards
        </h2>
        <span className="text-xs font-medium text-[#A8A5A0]">
          {activeCards.length} card{activeCards.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-sm text-[#7C7974] mb-4">
        Edit or remove cards before saving.
      </p>

      <Separator className="mb-5" />

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
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#E4E3E1] shadow-sm flex items-center justify-center text-[#7C7974] hover:text-[#3D3B38] transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {!isEditing && canScrollNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#E4E3E1] shadow-sm flex items-center justify-center text-[#7C7974] hover:text-[#3D3B38] transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Dots + counter */}
      {!isEditing && (
        <div className="flex flex-col items-center gap-1.5 mb-4">
          <div className="flex items-center gap-1.5">
            {activeCards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-[transform,background-color] duration-150 cursor-pointer ${
                  index === selectedIndex
                    ? "bg-[#3D3B38] scale-110"
                    : "bg-[#D3D1CE] hover:bg-[#A8A5A0]"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-[#A8A5A0]">
            {selectedIndex + 1} / {activeCards.length}
          </span>
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
            className="w-full h-11 rounded-lg bg-[#171614] hover:bg-[#252422] text-white text-sm font-medium cursor-pointer"
          >
            <Sparkles size={14} className="mr-2" />
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
