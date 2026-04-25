import type { ExerciseType } from "@/types/exercise";

const JSON_WRAPPER = `Respond ONLY with a single JSON code block. No explanation before or after.`;

export function buildFlashcardPrompt(
  topic: string,
  context?: string,
  count = 8
): string {
  const hasContext = Boolean(context);
  return `${JSON_WRAPPER}
${hasContext
  ? `Generate ${count} flashcards grounded in the source material below about: "${topic}"

Source material:
${context}

Rules for cards:
- Every card must be based on the teaching content in the source text and stay focused on "${topic}"
- Prioritize concepts, definitions, rules, steps, examples, syntax, and comparisons that directly match "${topic}"
- Do NOT generate generic knowledge cards — only what appears in the material
- Ignore document metadata unless the topic explicitly asks for it
- Never ask about authors, institutions, publishers, course/program names, years, locations, document codes, headers, footers, page numbers, URLs, or who created/wrote the material
- Never make cards about the document itself; make cards about the subject being taught
- Skip cover-page, citation, and administrative text unless it teaches the topic
- Front: a precise question about one concrete concept from the text
- Prefer question styles like "What is...", "How does...", "When is...", "Why does...", or "What is the difference between..."
- Avoid vague or meta questions like "What does the material discuss?" or "Who wrote this content?"
- Back: the exact answer as it appears or can be inferred from the material (concise, 1-3 sentences max)
- Hint: one keyword from the source text (optional)

Example:
- If topic is "basic Java", ask about variables, primitive types, conditionals, loops, methods, classes, or syntax basics
- Do NOT ask who wrote the PDF or which institution published it`
  : `Generate ${count} flashcards about: "${topic}"

Rules for cards:
- Keep every card tightly focused on "${topic}"
- Front: a clear, specific question about one concrete concept
- Prefer definitions, comparisons, usage rules, steps, and short applied questions
- Never ask about authors, sources, publication details, or document metadata
- Back: a concise, accurate answer (1-3 sentences max)
- Hint: one-word or short-phrase clue (optional)
- Vary difficulty from basic recall to applied understanding`}

ALL ${count} cards must be inside ONE single JSON object. Do NOT split into multiple blocks.

\`\`\`json
{
  "type": "flashcard",
  "title": "short descriptive title",
  "data": {
    "cards": [
      { "id": "c1", "front": "question", "back": "answer", "hint": "optional" },
      { "id": "c2", "front": "question", "back": "answer" }
    ]
  }
}
\`\`\``;
}

export function buildQuizPrompt(
  topic: string,
  context?: string,
  count = 6
): string {
  const hasContext = Boolean(context);
  return `${JSON_WRAPPER}
${hasContext
  ? `Generate a ${count}-question multiple choice quiz grounded in the source material below about: "${topic}"

Source material:
${context}

Rules for questions:
- Every question must test something specific from the source text
- Wrong options (distractors) should be plausible but clearly wrong to someone who read the material
- Explanation must reference what the material says`
  : `Generate a ${count}-question multiple choice quiz about: "${topic}"

Rules for questions:
- Test understanding, not just memorization
- Wrong options should be plausible distractors
- Explanation should be educational and brief`}

- Each question must have exactly 4 options
- correctIndex is 0-based
- Vary difficulty and randomize correct answer position

\`\`\`json
{
  "type": "quiz",
  "title": "short descriptive title",
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
\`\`\``;
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
