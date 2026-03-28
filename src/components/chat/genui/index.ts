import { registerComponent } from "@/lib/genui/registry";
import { StatCard } from "./StatCard";
import { ReviewSchedule } from "./ReviewSchedule";
import { FlashcardPreview } from "./FlashcardPreview";

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
