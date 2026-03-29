"use client";

import { useState } from "react";
import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { z } from "zod";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";

// ── StatCard ──────────────────────────────────────────────────────────────────
// Displays a single study metric.

const StatCard = defineComponent({
  name: "StatCard",
  description: "Displays a single study metric with a label, large value, and optional sublabel.",
  props: z.object({
    label: z.string().describe("What the stat measures, e.g. 'Cards due today'"),
    value: z.string().describe("The stat value formatted as string, e.g. '12' or '87%'"),
    sublabel: z.string().optional().describe("Additional context shown below the value"),
  }),
  component: ({ props }) => (
    <div className="rounded-xl border border-[#E8E5E0] bg-white px-5 py-4">
      <p className="text-xs text-[#9C9690]">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1A1814]">{props.value}</p>
      {props.sublabel && (
        <p className="mt-1 text-xs text-[#9C9690]">{props.sublabel}</p>
      )}
    </div>
  ),
});

// ── ReviewSchedule ────────────────────────────────────────────────────────────
// Upcoming review buckets with a "Estudar agora" shortcut.

const ReviewSchedule = defineComponent({
  name: "ReviewSchedule",
  description:
    "Shows upcoming review schedule grouped by time bucket (today, tomorrow, etc.) with card counts. Always include a study action.",
  props: z.object({
    items: z
      .array(
        z.object({
          label: z.string().describe("Time description, e.g. 'Hoje', 'Amanhã', 'Em 3 dias'"),
          count: z.number().describe("Number of cards due in this bucket"),
        })
      )
      .describe("Review buckets ordered from soonest to latest"),
  }),
  component: ({ props }) => {
    const { setActiveView } = useAppStore();
    return (
      <div className="space-y-2">
        <div className="divide-y divide-[#F3F4F6] rounded-xl border border-[#E8E5E0] bg-white">
          {props.items.map((item, i) => (
            <div key={i} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-[#6B7280]">{item.label}</span>
              <span className="font-medium text-[#1A1814]">{item.count} cards</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setActiveView("study")}
          className="w-full cursor-pointer rounded-xl border border-[#E8E5E0] bg-white py-2 text-sm font-medium text-[#1A1814] transition-colors hover:bg-[#F9FAFB]"
        >
          Estudar agora →
        </button>
      </div>
    );
  },
});

// ── DeckDiagnostic ────────────────────────────────────────────────────────────
// Decks that need attention, with per-deck review shortcut.

const DeckDiagnostic = defineComponent({
  name: "DeckDiagnostic",
  description:
    "Shows decks that need attention, listing overdue cards and retention rate per deck. Use when the user asks what they are falling behind on.",
  props: z.object({
    decks: z.array(
      z.object({
        name: z.string().describe("Deck or library name"),
        overdueCards: z.number().describe("Number of overdue cards in this deck"),
        retentionRate: z.number().describe("Retention percentage 0-100"),
      })
    ),
  }),
  component: ({ props }) => {
    const { setActiveView } = useAppStore();
    return (
      <div className="divide-y divide-[#F3F4F6] rounded-xl border border-[#E8E5E0] bg-white">
        {props.decks.map((deck, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#1A1814]">{deck.name}</p>
              <p className="mt-0.5 text-xs text-[#9C9690]">
                {deck.overdueCards} atrasados · {deck.retentionRate}% retenção
              </p>
            </div>
            <button
              onClick={() => setActiveView("study")}
              className="cursor-pointer rounded-lg border border-[#E8E5E0] px-3 py-1.5 text-xs font-medium text-[#1A1814] transition-colors hover:bg-[#F9FAFB]"
            >
              Revisar
            </button>
          </div>
        ))}
      </div>
    );
  },
});

// ── FlashCardBatch ────────────────────────────────────────────────────────────
// AI-generated cards with a one-click save to SRS deck.

const FlashCardBatch = defineComponent({
  name: "FlashCardBatch",
  description:
    "Shows a batch of AI-generated flashcards with a button to save them to the SRS deck. Use when the user asks to generate flashcards on a topic.",
  props: z.object({
    cards: z.array(
      z.object({
        question: z.string().describe("Flashcard front — the question"),
        answer: z.string().describe("Flashcard back — the answer"),
      })
    ),
    deckName: z
      .string()
      .describe("Topic or deck name shown on the save button, e.g. 'Big O Notation'"),
  }),
  component: ({ props }) => {
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (saving || saved) return;
      setSaving(true);
      try {
        await StorageService.createSRSCards(
          props.cards.map((c) => ({ front: c.question, back: c.answer }))
        );
        setSaved(true);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {props.cards.map((card, i) => (
            <div key={i} className="rounded-xl border border-[#E8E5E0] bg-white p-4">
              <p className="text-sm font-medium text-[#1A1814]">{card.question}</p>
              <p className="mt-2 border-t border-[#F3F4F6] pt-2 text-xs text-[#9C9690]">
                {card.answer}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full cursor-pointer rounded-xl border border-[#E8E5E0] bg-white py-2 text-sm font-medium text-[#1A1814] transition-colors hover:bg-[#F9FAFB] disabled:cursor-default disabled:opacity-50"
        >
          {saved
            ? "✓ Adicionado ao deck"
            : saving
            ? "Salvando..."
            : `Adicionar ao deck "${props.deckName}"`}
        </button>
      </div>
    );
  },
});

// ── Library ───────────────────────────────────────────────────────────────────

export const discentiaLibrary = createLibrary({
  components: [StatCard, ReviewSchedule, DeckDiagnostic, FlashCardBatch],
});
