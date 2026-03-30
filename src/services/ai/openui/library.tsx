"use client";

import { useState } from "react";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";
import { StorageService } from "@/services/storage";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";

/**
 * Markdown — plain text / markdown fallback.
 * The LLM uses this as root when no specialized UI component is needed.
 */
export const Markdown = defineComponent({
  name: "Markdown",
  description:
    "Renders a markdown text response. Use as root for any answer that does not need a specialized UI component.",
  props: z.object({
    content: z.string().describe("The full response in markdown format"),
  }),
  component: ({ props }) => <MarkdownRenderer content={props.content} />,
});

/**
 * StatCard — a single numeric stat (cards due, streak, etc.)
 */
export const StatCard = defineComponent({
  name: "StatCard",
  description:
    "Displays a single statistic with a label, large numeric value, and optional sublabel. Use for metrics: cards due today, streak, reviewed today, total cards.",
  props: z.object({
    label: z.string().describe("What the stat measures, e.g. 'Cards due today'"),
    value: z.string().describe("The stat value formatted as a string, e.g. '12'"),
    sublabel: z
      .string()
      .optional()
      .describe("Optional additional context, e.g. '3 overdue'"),
  }),
  component: ({ props }) => (
    <Card className="inline-block min-w-[140px]">
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{props.label}</p>
        <p className="text-2xl font-medium mt-0.5">{props.value}</p>
        {props.sublabel && (
          <p className="text-xs text-muted-foreground mt-1">{props.sublabel}</p>
        )}
      </CardContent>
    </Card>
  ),
});

/**
 * ReviewSchedule — upcoming review schedule with card counts per time bucket.
 */
export const ReviewSchedule = defineComponent({
  name: "ReviewSchedule",
  description:
    "Shows a list of upcoming review buckets with card counts per time period. Use when the user asks about their review schedule or upcoming cards.",
  props: z.object({
    items: z
      .array(
        z.object({
          label: z
            .string()
            .describe("Time description, e.g. 'Today', 'Tomorrow', 'In 3 days'"),
          count: z.number().describe("Number of cards due in this bucket"),
        })
      )
      .describe("Array of upcoming review buckets"),
  }),
  component: ({ props }) => {
    const { setActiveView } = useAppStore();
    return (
      <Card className="max-w-xs">
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar size={13} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Upcoming
            </span>
          </div>
          {props.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.count} cards</span>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            onClick={() => setActiveView("study")}
          >
            Estudar agora →
          </Button>
        </CardContent>
      </Card>
    );
  },
});

/**
 * DeckDiagnostic — decks that need attention, with overdue cards and retention rate.
 */
export const DeckDiagnostic = defineComponent({
  name: "DeckDiagnostic",
  description:
    "Shows decks that need attention with overdue card counts and retention rates. Use when the user asks what they are falling behind on or which decks need review.",
  props: z.object({
    decks: z
      .array(
        z.object({
          name: z.string().describe("Deck / library name"),
          overdueCards: z.number().describe("Number of overdue cards"),
          retentionRate: z
            .number()
            .describe("Retention rate as a percentage 0-100"),
        })
      )
      .describe("Array of decks needing attention"),
  }),
  component: ({ props }) => {
    const { setActiveView } = useAppStore();
    return (
      <Card className="max-w-xs">
        <CardContent className="p-0 divide-y">
          {props.decks.map((deck, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{deck.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deck.overdueCards} atrasados · {deck.retentionRate}% retenção
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView("study")}
              >
                Revisar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  },
});

/**
 * FlashCardBatch — a set of AI-generated flashcards with a one-click save button.
 */
export const FlashCardBatch = defineComponent({
  name: "FlashCardBatch",
  description:
    "Displays a batch of AI-generated flashcards with a button to save them to the SRS deck. Use when the user asks to generate flashcards from content.",
  props: z.object({
    cards: z
      .array(
        z.object({
          question: z.string().describe("The flashcard question or front"),
          answer: z.string().describe("The flashcard answer or back"),
        })
      )
      .describe("Array of flashcards to display and optionally save"),
    deckName: z
      .string()
      .describe("Topic or deck name shown on the save button"),
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
      <div className="space-y-2 max-w-sm">
        {props.cards.map((card, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-medium">{card.question}</p>
              <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                {card.answer}
              </p>
            </CardContent>
          </Card>
        ))}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saved
            ? "✓ Adicionado ao deck"
            : saving
            ? "Salvando..."
            : `Adicionar ao deck "${props.deckName}"`}
        </Button>
      </div>
    );
  },
});
