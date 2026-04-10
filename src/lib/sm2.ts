import type { SRSCard } from "@/types/srs";

export type ReviewRating = "hard" | "good" | "easy";

const RATING_TO_Q: Record<ReviewRating, number> = {
  hard: 2,
  good: 4,
  easy: 5,
};

export function sm2(card: SRSCard, rating: ReviewRating): SRSCard {
  const q = RATING_TO_Q[rating];
  const now = Date.now();

  if (q < 3) {
    return {
      ...card,
      repetitions: 0,
      interval: 1,
      lapses: card.lapses + 1,
      lastReviewDate: now,
      nextReviewDate: now + 86400000,
    };
  }

  const newEase = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  const newInterval =
    card.repetitions === 0
      ? q === 5 ? 4 : 1
      : card.repetitions === 1
      ? 6
      : Math.round(card.interval * newEase);

  return {
    ...card,
    repetitions: card.repetitions + 1,
    interval: newInterval,
    easeFactor: newEase,
    lastReviewDate: now,
    nextReviewDate: now + newInterval * 86400000,
  };
}
