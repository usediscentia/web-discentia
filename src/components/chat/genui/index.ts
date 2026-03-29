import { registerComponent } from "@/lib/genui/registry";
import { StatCard } from "./StatCard";
import { ReviewSchedule } from "./ReviewSchedule";
import { FlashcardPreview } from "./FlashcardPreview";
import { DeckDiagnostic } from "./DeckDiagnostic";
import { FlashCardBatch } from "./FlashCardBatch";

registerComponent({
  name: "StatCard",
  description: "Displays a single statistic with label, large value, and optional sublabel.",
  propsSchema: {
    label: { type: "string", description: "What the stat measures", required: true },
    value: { type: "string", description: "The stat value (formatted as string)", required: true },
    sublabel: { type: "string", description: "Additional context below the value", required: false },
  },
  component: StatCard,
});

registerComponent({
  name: "ReviewSchedule",
  description: "Shows a list of upcoming review buckets with card counts. Use when the user asks about their review schedule.",
  propsSchema: {
    items: {
      type: "array",
      description: "Array of { label: string, count: number } objects. Label is a time description (e.g. 'Tomorrow', 'In 3 days'), count is number of cards.",
      required: true,
      items: { label: "string", count: "number" },
    },
  },
  component: ReviewSchedule,
});

registerComponent({
  name: "FlashcardPreview",
  description: "Shows a preview of a flashcard question with its category. Use when showing sample cards.",
  propsSchema: {
    question: { type: "string", description: "The flashcard question text", required: true },
    category: { type: "string", description: "The category or topic name", required: true },
  },
  component: FlashcardPreview,
});

registerComponent({
  name: "DeckDiagnostic",
  description: "Shows decks that need attention with overdue card counts and retention rate. Use when user asks what they are falling behind on.",
  propsSchema: {
    decks: {
      type: "array",
      description: "Array of { name: string, overdueCards: number, retentionRate: number }. retentionRate is 0-100.",
      required: true,
      items: { name: "string", overdueCards: "number", retentionRate: "number" },
    },
  },
  component: DeckDiagnostic,
});

registerComponent({
  name: "FlashCardBatch",
  description: "Shows a batch of AI-generated flashcards with a button to save them to the SRS deck. Use when user asks to generate flashcards.",
  propsSchema: {
    cards: {
      type: "array",
      description: "Array of { question: string, answer: string } objects.",
      required: true,
      items: { question: "string", answer: "string" },
    },
    deckName: { type: "string", description: "Topic or deck name shown on the save button.", required: true },
  },
  component: FlashCardBatch,
});
