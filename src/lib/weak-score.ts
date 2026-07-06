/**
 * Weakness score for a group of reviewed cards: ease distance from default
 * weighted 0.7, lapses per card (saturating at 10) weighted 0.3. Range 0–1.
 */
export function computeWeakScore(
  easeFactors: number[],
  totalLapses: number
): number {
  if (easeFactors.length === 0) return 0;
  const avgEase =
    easeFactors.reduce((a, b) => a + b, 0) / easeFactors.length;
  const easeScore = Math.max(0, Math.min(1, (2.5 - avgEase) / (2.5 - 1.3)));
  const lapseScore = Math.min(1, totalLapses / easeFactors.length / 10);
  return easeScore * 0.7 + lapseScore * 0.3;
}

/**
 * Weakest cards first: lowest ease factor, then most lapses. Fresh cards
 * (default ease, no lapses) naturally sort last.
 */
export function sortWeakestCards<
  T extends { easeFactor: number; lapses: number },
>(cards: T[], limit: number): T[] {
  return [...cards]
    .sort((a, b) => a.easeFactor - b.easeFactor || b.lapses - a.lapses)
    .slice(0, limit);
}
