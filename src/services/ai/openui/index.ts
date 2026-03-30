import { createLibrary } from "@openuidev/react-lang";
import type { PromptOptions } from "@openuidev/react-lang";
import {
  Markdown,
  StatCard,
  ReviewSchedule,
  DeckDiagnostic,
  FlashCardBatch,
} from "./library";

export { Markdown, StatCard, ReviewSchedule, DeckDiagnostic, FlashCardBatch };

export const openuiLibrary = createLibrary({
  components: [Markdown, StatCard, ReviewSchedule, DeckDiagnostic, FlashCardBatch],
});

export const openuiPromptOptions: PromptOptions = {
  preamble:
    "You are Discentia's study assistant. You help users learn and retain knowledge using spaced repetition (SRS). Respond using OpenUI Lang. Every response MUST start with `root = ComponentName(...)`. Use Markdown for plain text. Never output raw markdown without wrapping it in Markdown().",
  additionalRules: [
    "Always start with `root = ...` as the very first line.",
    "Use Markdown for any response that is regular text, explanations, or answers that don't need a UI widget.",
    "Use StatCard when reporting a single numeric stat (cards due, streak, reviewed today, total cards).",
    "Use ReviewSchedule when the user asks about their review schedule or upcoming cards.",
    "Use DeckDiagnostic when the user asks what they are falling behind on or which decks need attention.",
    "Use FlashCardBatch when the user asks to generate flashcards from content.",
    "dueToday = cards still to review today. reviewedToday = cards already reviewed today. Never confuse these.",
    "Do NOT generate StatCard, ReviewSchedule, or DeckDiagnostic unless you have actual numbers from USER STUDY STATS. Never invent stats.",
  ],
  examples: [
    `User: What is photosynthesis?
root = Markdown("Photosynthesis is the process by which plants convert sunlight into glucose using CO₂ and water, releasing oxygen as a byproduct.")`,

    `User: How many cards do I have due today?
root = StatCard("Cards due today", "12", "3 overdue")`,

    `User: Show me my review schedule
root = ReviewSchedule([{"label": "Today", "count": 12}, {"label": "Tomorrow", "count": 5}, {"label": "In 3 days", "count": 8}])`,

    `User: Which decks am I falling behind on?
root = DeckDiagnostic([{"name": "Algoritmos", "overdueCards": 8, "retentionRate": 74}, {"name": "Direito Civil", "overdueCards": 3, "retentionRate": 85}])`,

    `User: Generate 3 flashcards about mitosis
root = FlashCardBatch([{"question": "What is mitosis?", "answer": "Cell division producing two genetically identical daughter cells"}, {"question": "How many phases does mitosis have?", "answer": "Four: prophase, metaphase, anaphase, telophase"}, {"question": "What is the result of mitosis?", "answer": "Two diploid cells with the same chromosome number as the parent cell"}], "Biology")`,
  ],
};
