/**
 * Distributes cards over time using a power curve that front-loads
 * earlier days (exponent 0.8), giving more time for SRS reviews
 * before the target date.
 *
 * Returns an array of timestamps (startOfDay), one per card.
 */
export function distributeCards(
  cardCount: number,
  targetDate: Date
): number[] {
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);
  const totalDays = Math.max(1, Math.round((target.getTime() - today.getTime()) / 86_400_000));

  return Array.from({ length: cardCount }, (_, i) => {
    const ratio = i / Math.max(1, cardCount);
    const dayOffset = Math.floor(Math.pow(ratio, 0.8) * totalDays);
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    return d.getTime();
  });
}

/** Returns average cards per day for a given card count and target date. */
export function cardsPerDay(cardCount: number, targetDate: Date): number {
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);
  const totalDays = Math.max(1, Math.round((target.getTime() - today.getTime()) / 86_400_000));
  return Math.ceil(cardCount / totalDays);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
