/**
 * Weekly completion for the streak card.
 *
 * Day keys use the same local-timezone `YYYY-MM-DD` format as `toDayKey`
 * in the storage service, so circles always agree with the streak count.
 */
function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Returns 7 booleans, Monday-first, for the week containing `today`.
 * A day is completed when it has ≥1 review in `activityByDay`.
 */
export function getWeekCompletion(
  activityByDay: Record<string, number>,
  today: Date = new Date()
): boolean[] {
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return (activityByDay[toDayKey(day)] ?? 0) > 0;
  });
}
