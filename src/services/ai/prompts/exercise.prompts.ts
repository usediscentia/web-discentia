import type { ExerciseType } from "@/types/exercise";

const JSON_WRAPPER = `Respond ONLY with a single JSON code block. No explanation before or after.`;

export function buildFlashcardPrompt(
  topic: string,
  context?: string,
  count = 8
): string {
  return `${JSON_WRAPPER}
Generate ${count} flashcards about: "${topic}"
${context ? `\nUse this material as source:\n${context}\n` : ""}
\`\`\`json
{
  "type": "flashcard",
  "title": "short title here",
  "data": {
    "cards": [
      { "id": "c1", "front": "question text", "back": "answer text", "hint": "optional hint" }
    ]
  }
}
\`\`\`
Rules:
- Each card must have unique id (c1, c2, etc)
- Front: clear question or term
- Back: concise but complete answer
- Hint: one-word or short phrase clue (optional)
- Vary difficulty across cards`;
}

export function buildQuizPrompt(
  topic: string,
  context?: string,
  count = 6
): string {
  return `${JSON_WRAPPER}
Generate a ${count}-question multiple choice quiz about: "${topic}"
${context ? `\nUse this material as source:\n${context}\n` : ""}
\`\`\`json
{
  "type": "quiz",
  "title": "short title here",
  "data": {
    "questions": [
      {
        "id": "q1",
        "question": "question text",
        "options": ["option A", "option B", "option C", "option D"],
        "correctIndex": 0,
        "explanation": "why this is correct"
      }
    ]
  }
}
\`\`\`
Rules:
- Each question must have exactly 4 options
- correctIndex is 0-based
- explanation should be educational and brief
- Vary question difficulty
- Randomize correct answer position across questions`;
}

export function buildSprintPrompt(
  topic: string,
  context?: string,
  count = 10
): string {
  return `${JSON_WRAPPER}
Generate a ${count}-question speed quiz about: "${topic}"
${context ? `\nUse this material as source:\n${context}\n` : ""}
\`\`\`json
{
  "type": "sprint",
  "title": "short title here",
  "data": {
    "questions": [
      {
        "id": "s1",
        "question": "quick question",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0
      }
    ],
    "timePerQuestion": 15
  }
}
\`\`\`
Rules:
- Questions should be quick to read and answer
- Keep questions short (under 15 words)
- Keep options short (1-4 words each)
- Exactly 4 options per question
- timePerQuestion in seconds (10-20 range)`;
}

export function buildConnectionsPrompt(
  topic: string,
  context?: string
): string {
  return `${JSON_WRAPPER}
Generate a Connections puzzle (like NYT Connections) about: "${topic}"
${context ? `\nUse this material as source:\n${context}\n` : ""}
\`\`\`json
{
  "type": "connections",
  "title": "short title here",
  "data": {
    "groups": [
      {
        "category": "group name",
        "words": ["word1", "word2", "word3", "word4"],
        "difficulty": 1,
        "color": "#FACC15"
      }
    ]
  }
}
\`\`\`
Rules:
- Exactly 4 groups, each with exactly 4 words (16 total)
- Difficulty: 1 (easiest) to 4 (hardest)
- Colors: difficulty 1="#FACC15", 2="#4ADE80", 3="#60A5FA", 4="#C084FC"
- Words should be single words or very short phrases
- Some words should be tricky (could fit multiple groups)`;
}

export function buildFillGapPrompt(
  topic: string,
  context?: string
): string {
  return `${JSON_WRAPPER}
Generate a fill-in-the-gap exercise about: "${topic}"
${context ? `\nUse this material as source:\n${context}\n` : ""}
\`\`\`json
{
  "type": "fillgap",
  "title": "short title here",
  "data": {
    "passage": "Text with {{g1}} placeholders for {{g2}} gaps.",
    "gaps": [
      { "id": "g1", "answer": "correct word", "position": 0 },
      { "id": "g2", "answer": "another word", "position": 1 }
    ],
    "wordBank": ["correct word", "another word", "distractor1", "distractor2"]
  }
}
\`\`\`
Rules:
- Passage should be 3-5 sentences, educational
- Use {{gapId}} syntax for blanks
- 4-8 gaps per passage
- Word bank includes all correct answers PLUS 2-3 distractors
- Position is the order the gap appears (0-indexed)`;
}

export function buildCrosswordPrompt(
  topic: string,
  context?: string
): string {
  return `${JSON_WRAPPER}
Generate a small crossword puzzle about: "${topic}"
${context ? `\nUse this material as source:\n${context}\n` : ""}
\`\`\`json
{
  "type": "crossword",
  "title": "short title here",
  "data": {
    "size": { "rows": 10, "cols": 10 },
    "clues": [
      {
        "direction": "across",
        "number": 1,
        "clue": "clue text",
        "answer": "ANSWER",
        "startRow": 0,
        "startCol": 0
      }
    ]
  }
}
\`\`\`
Rules:
- Grid size 8-12 rows/cols
- 6-10 clues total (mix of across and down)
- Answers in UPPERCASE, no spaces
- Clues should be concise (under 10 words)
- Words must intersect where they share letters
- startRow and startCol are 0-indexed`;
}

export function buildBossFightPrompt(
  topic: string,
  context?: string
): string {
  return `${JSON_WRAPPER}
Generate a Boss Fight quiz about: "${topic}"
${context ? `\nUse this material as source:\n${context}\n` : ""}
\`\`\`json
{
  "type": "bossfight",
  "title": "short title here",
  "data": {
    "bossName": "dramatic boss name related to topic",
    "totalHP": 100,
    "rounds": [
      {
        "id": "r1",
        "type": "multiple_choice",
        "question": "question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "B",
        "isLeech": false,
        "damage": 20,
        "hints": ["hint 1"]
      }
    ],
    "playerLives": 3
  }
}
\`\`\`
Rules:
- 5-8 rounds
- Mix of multiple_choice and free_form types
- damage should sum to >= totalHP so the boss can be defeated
- isLeech true for 1-2 particularly tricky questions
- Each round has 1-2 hints
- Boss name should be thematic and fun`;
}

const PROMPT_BUILDERS: Record<
  ExerciseType,
  (topic: string, context?: string) => string
> = {
  flashcard: buildFlashcardPrompt,
  quiz: buildQuizPrompt,
  sprint: buildSprintPrompt,
  connections: buildConnectionsPrompt,
  fillgap: buildFillGapPrompt,
  crossword: buildCrosswordPrompt,
  bossfight: buildBossFightPrompt,
};

export function buildExercisePrompt(
  type: ExerciseType,
  topic: string,
  context?: string
): string {
  return PROMPT_BUILDERS[type](topic, context);
}
