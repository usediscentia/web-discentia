const JSON_WRAPPER = `Respond ONLY with a single JSON object. No markdown fences, no explanation before or after.`;

const MAX_SOURCE_CHARS = 1500;

export interface EvaluationResult {
  verdict: "correct" | "partial" | "incorrect";
  explanation: string;
  keyMissing: string | null;
}

export function buildEvaluationPrompt(params: {
  front: string;
  back: string;
  userAnswer: string;
  sourceContext?: string;
}): string {
  const { front, back, userAnswer, sourceContext } = params;

  const sourceBlock = sourceContext
    ? `\nSOURCE MATERIAL (ground truth — grade against this, not just the card back):\n${sourceContext.slice(0, MAX_SOURCE_CHARS)}\n`
    : "";

  return `${JSON_WRAPPER}

You are a subject matter expert and educator evaluating a student's flashcard answer.

QUESTION: ${front}
CORRECT ANSWER: ${back}
STUDENT'S ANSWER: ${userAnswer}
${sourceBlock}
Grading criteria:
- "correct": The student demonstrates understanding of the core concept. Different wording, synonyms, or rephrasing is fine as long as the meaning is accurate.
- "partial": The student shows some understanding but is missing a key element, is imprecise in a way that matters, or only addresses part of the answer.
- "incorrect": The student's answer is fundamentally wrong, confused with something else, or misses the point entirely.

Be lenient with wording and phrasing. Be strict with conceptual accuracy.

Respond with this exact JSON structure:
{"verdict":"correct","explanation":"2-3 sentences explaining why the answer is right/wrong. Reference what the correct answer says.","keyMissing":null}

Rules:
- "explanation": 2-3 sentences. Explain the evaluation and teach the student something useful.
- "keyMissing": null for correct verdicts. For partial/incorrect, state specifically what the student should have included or corrected (one concise sentence).`;
}
