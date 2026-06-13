import type { SRSCard } from "@/types/srs";
import type { AIServiceProvider, ProviderConfig } from "@/types/ai";
import { buildEvaluationPrompt, type EvaluationResult } from "./prompts/review.prompts";

export type { EvaluationResult };

export async function evaluateAnswer(
  card: SRSCard,
  answer: string,
  sourceContext: string | undefined,
  provider: AIServiceProvider | null | undefined,
  config: ProviderConfig
): Promise<EvaluationResult> {
  try {
    if (!provider) throw new Error(`No provider for type: ${config.type}`);

    const prompt = buildEvaluationPrompt({
      front: card.front,
      back: card.back,
      userAnswer: answer,
      sourceContext,
    });

    const raw = await new Promise<string>((resolve, reject) => {
      provider
        .sendMessage([{ role: "user", content: prompt }], config, {
          onToken: () => {},
          onComplete: resolve,
          onError: reject,
        })
        .catch(reject);
    });

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as EvaluationResult;
    const VALID_VERDICTS = ["correct", "partial", "incorrect"] as const;
    return {
      verdict: VALID_VERDICTS.includes(parsed.verdict) ? parsed.verdict : "partial",
      explanation: parsed.explanation,
      keyMissing: parsed.keyMissing ?? null,
    };
  } catch {
    return {
      verdict: answer.length > 10 ? "partial" : "incorrect",
      explanation: "Could not evaluate — check the correct answer.",
      keyMissing: null,
    };
  }
}
