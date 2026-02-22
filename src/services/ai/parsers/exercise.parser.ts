import type { Exercise, ExerciseType } from "@/types/exercise";
import { nanoid } from "nanoid";

const VALID_TYPES: ExerciseType[] = [
  "flashcard",
  "quiz",
  "sprint",
  "fillgap",
  "connections",
  "crossword",
  "bossfight",
];

/**
 * Attempt to extract an exercise JSON from an AI response.
 * Returns null if no valid exercise is found.
 */
export function parseExerciseFromResponse(
  content: string,
  messageId: string
): Exercise | null {
  try {
    const json = extractJSON(content);
    if (!json) return null;

    const parsed = JSON.parse(json);
    if (!parsed.type || !parsed.data) return null;
    if (!VALID_TYPES.includes(parsed.type)) return null;

    // Basic structural validation per type
    if (!validateExerciseData(parsed.type, parsed.data)) return null;

    return {
      id: nanoid(),
      messageId,
      type: parsed.type,
      title: parsed.title || `${parsed.type} exercise`,
      data: parsed.data,
      results: [],
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}

function extractJSON(text: string): string | null {
  // Try ```json code blocks first
  const codeBlock = text.match(/```json\s*\n?([\s\S]+?)\n?\s*```/);
  if (codeBlock) return codeBlock[1].trim();

  // Try bare JSON object — use a balanced-brace approach to avoid over-matching
  const startIdx = text.indexOf("{");
  if (startIdx !== -1) {
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      const candidate = text.slice(startIdx, endIdx + 1);
      if (/"type"\s*:/.test(candidate)) return candidate.trim();
    }
  }

  return null;
}

function validateExerciseData(
  type: ExerciseType,
  data: Record<string, unknown>
): boolean {
  switch (type) {
    case "flashcard":
      return Array.isArray(data.cards) && data.cards.length > 0;
    case "quiz":
      return Array.isArray(data.questions) && data.questions.length > 0;
    case "sprint":
      return (
        Array.isArray(data.questions) &&
        data.questions.length > 0 &&
        typeof data.timePerQuestion === "number"
      );
    case "connections":
      return Array.isArray(data.groups) && data.groups.length === 4;
    case "fillgap":
      return (
        typeof data.passage === "string" &&
        Array.isArray(data.gaps) &&
        Array.isArray(data.wordBank)
      );
    case "crossword":
      return (
        data.size != null &&
        Array.isArray(data.clues) &&
        data.clues.length > 0
      );
    case "bossfight":
      return (
        typeof data.bossName === "string" &&
        Array.isArray(data.rounds) &&
        data.rounds.length > 0
      );
    default:
      return false;
  }
}

/**
 * Detect if the user message is requesting an exercise.
 * Returns the exercise type and topic, or null.
 */
export function detectExerciseIntent(
  message: string
): { type: ExerciseType; topic: string } | null {
  const lower = message.toLowerCase();

  const patterns: { type: ExerciseType; keywords: RegExp }[] = [
    // With action verb: "create flashcards about X"
    {
      type: "flashcard",
      keywords:
        /(?:create|make|generate|build)\s+(?:some\s+)?flashcards?\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "quiz",
      keywords:
        /(?:create|make|generate|build)\s+(?:a\s+)?quiz\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "sprint",
      keywords:
        /(?:create|make|generate|build|start)\s+(?:a\s+)?sprint\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "connections",
      keywords:
        /(?:create|make|generate|build)\s+(?:a\s+)?connections?\s+(?:puzzle\s+)?(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "fillgap",
      keywords:
        /(?:create|make|generate|build)\s+(?:a\s+)?fill[\s-]?(?:the[\s-]?)?gap\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "crossword",
      keywords:
        /(?:create|make|generate|build)\s+(?:a\s+)?crossword\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "bossfight",
      keywords:
        /(?:create|make|generate|build|start)\s+(?:a\s+)?boss[\s-]?fight\s+(?:about|on|for)\s+(.+)/i,
    },
    // Without action verb: "flashcards about X", "quiz on Y"
    {
      type: "flashcard",
      keywords: /flashcards?\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "quiz",
      keywords: /quiz\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "sprint",
      keywords: /sprint\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "connections",
      keywords: /connections?\s+(?:puzzle\s+)?(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "fillgap",
      keywords: /fill[\s-]?(?:the[\s-]?)?gap\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "crossword",
      keywords: /crossword\s+(?:about|on|for)\s+(.+)/i,
    },
    {
      type: "bossfight",
      keywords: /boss[\s-]?fight\s+(?:about|on|for)\s+(.+)/i,
    },
  ];

  for (const { type, keywords } of patterns) {
    const match = message.match(keywords);
    if (match) return { type, topic: match[1].trim() };
  }

  // Generic exercise detection — keyword anywhere in message
  const typeKeywords: { type: ExerciseType; words: string[] }[] = [
    { type: "flashcard", words: ["flashcard", "flash card"] },
    { type: "quiz", words: ["quiz"] },
    { type: "sprint", words: ["sprint"] },
    { type: "connections", words: ["connections game", "connections puzzle"] },
    { type: "fillgap", words: ["fill the gap", "fill gap", "fillgap", "fill-gap", "fill in the blank"] },
    { type: "crossword", words: ["crossword"] },
    { type: "bossfight", words: ["boss fight", "bossfight"] },
  ];

  for (const { type, words } of typeKeywords) {
    if (words.some((w) => lower.includes(w))) {
      const topicMatch = message.match(
        /(?:about|on|for|regarding)\s+(.+?)(?:\.|$)/i
      );
      const topic = topicMatch ? topicMatch[1].trim() : message;
      return { type, topic };
    }
  }

  return null;
}
