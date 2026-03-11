import type { Exercise, ExerciseType } from "@/types/exercise";
import type { AIServiceProvider, ProviderConfig } from "@/types/ai";
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

    // Normalise: if model put a single card's fields directly in data instead of data.cards[]
    if (
      parsed.type === "flashcard" &&
      !Array.isArray(parsed.data.cards) &&
      typeof parsed.data.front === "string"
    ) {
      parsed.data = {
        cards: [{ id: parsed.data.id ?? "c1", front: parsed.data.front, back: parsed.data.back ?? "", hint: parsed.data.hint }],
      };
    }

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

// Prepositions that introduce the topic of an exercise request.
// Covers: "about X", "on X", "for X", "based on X", "using X", "from X", "covering X", "related to X"
const PREP = String.raw`(?:about|on|for|based\s+on|using|from|covering|regarding|related\s+to)`;

/**
 * Detect if the user message is requesting an exercise.
 * Returns the exercise type and topic, or null.
 */
export function detectExerciseIntent(
  message: string
): { type: ExerciseType; topic: string } | null {
  const lower = message.toLowerCase();

  const patterns: { type: ExerciseType; keywords: RegExp }[] = [
    // With action verb: "create flashcards about X", "create a quiz based on X"
    {
      type: "flashcard",
      keywords: new RegExp(
        String.raw`(?:create|make|generate|build)\s+(?:some\s+)?flashcards?\s+${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "quiz",
      keywords: new RegExp(
        String.raw`(?:create|make|generate|build)\s+(?:a\s+)?quiz\s+${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "sprint",
      keywords: new RegExp(
        String.raw`(?:create|make|generate|build|start)\s+(?:a\s+)?sprint\s+${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "connections",
      keywords: new RegExp(
        String.raw`(?:create|make|generate|build)\s+(?:a\s+)?connections?\s+(?:puzzle\s+)?${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "fillgap",
      keywords: new RegExp(
        String.raw`(?:create|make|generate|build)\s+(?:a\s+)?fill[\s-]?(?:the[\s-]?)?gap\s+${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "crossword",
      keywords: new RegExp(
        String.raw`(?:create|make|generate|build)\s+(?:a\s+)?crossword\s+${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "bossfight",
      keywords: new RegExp(
        String.raw`(?:create|make|generate|build|start)\s+(?:a\s+)?boss[\s-]?fight\s+${PREP}\s+(.+)`,
        "i"
      ),
    },
    // Without action verb: "flashcards about X", "quiz based on Y"
    {
      type: "flashcard",
      keywords: new RegExp(String.raw`flashcards?\s+${PREP}\s+(.+)`, "i"),
    },
    {
      type: "quiz",
      keywords: new RegExp(String.raw`quiz\s+${PREP}\s+(.+)`, "i"),
    },
    {
      type: "sprint",
      keywords: new RegExp(String.raw`sprint\s+${PREP}\s+(.+)`, "i"),
    },
    {
      type: "connections",
      keywords: new RegExp(
        String.raw`connections?\s+(?:puzzle\s+)?${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "fillgap",
      keywords: new RegExp(
        String.raw`fill[\s-]?(?:the[\s-]?)?gap\s+${PREP}\s+(.+)`,
        "i"
      ),
    },
    {
      type: "crossword",
      keywords: new RegExp(String.raw`crossword\s+${PREP}\s+(.+)`, "i"),
    },
    {
      type: "bossfight",
      keywords: new RegExp(String.raw`boss[\s-]?fight\s+${PREP}\s+(.+)`, "i"),
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
        new RegExp(String.raw`${PREP}\s+(.+?)(?:\.|$)`, "i")
      );
      const topic = topicMatch ? topicMatch[1].trim() : message;
      return { type, topic };
    }
  }

  return null;
}

const CLASSIFIER_SYSTEM_PROMPT = `You are a classifier. Determine if the user message is EXPLICITLY requesting that a learning exercise be CREATED or GENERATED.

Reply ONLY with a raw JSON object — no markdown, no explanation:
- If explicitly requesting an exercise: {"type":"flashcard","topic":"..."} (use the detected type and the full topic)
- If NOT requesting an exercise: {"type":null}

IMPORTANT rules:
- Factual questions ("what is X?", "how many X?", "explain Y") are NOT exercise requests → {"type":null}
- Conversational messages, greetings, or instructions are NOT exercise requests → {"type":null}
- Only return a type if the user is clearly asking to CREATE, GENERATE, MAKE, or BUILD an exercise.

Valid types: flashcard, quiz, sprint, connections, fillgap, crossword, bossfight
- flashcard: explicitly wants flashcards / flash cards to study
- quiz: explicitly wants a quiz, test, or questionnaire to answer
- sprint: explicitly wants a speed quiz or sprint mode
- connections: explicitly wants a connections puzzle (group related words)
- fillgap: explicitly wants a fill-in-the-blank / fill the gap exercise
- crossword: explicitly wants a crossword puzzle
- bossfight: explicitly wants a boss fight challenge

Extract the topic as the subject matter to study (e.g. "World War II", "photosynthesis").`;

/**
 * AI-based exercise intent classifier — used as fallback when regex detection fails.
 * Wraps the provider's streaming sendMessage into a Promise.
 */
export async function classifyExerciseIntentWithAI(
  message: string,
  provider: AIServiceProvider,
  config: ProviderConfig
): Promise<{ type: ExerciseType; topic: string } | null> {
  return new Promise((resolve) => {
    provider
      .sendMessage(
        [
          { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        config,
        {
          onToken: () => {
            // discard streaming tokens — we only need the final text
          },
          onComplete: (fullText) => {
            try {
              const clean = fullText.replace(/```json\n?|\n?```/g, "").trim();
              const parsed = JSON.parse(clean);
              if (parsed.type && VALID_TYPES.includes(parsed.type as ExerciseType)) {
                resolve({
                  type: parsed.type as ExerciseType,
                  topic: (parsed.topic as string) || message,
                });
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          },
          onError: () => resolve(null),
        }
      )
      .catch(() => resolve(null));
  });
}
