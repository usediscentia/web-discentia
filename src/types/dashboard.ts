export interface DashboardStats {
  dueToday: number;
  reviewedToday: number;
  streak: number;
  totalCards: number;
  masteredCards: number;
  libraryItemCount: number;
  activityByDay: Record<string, number>; // "YYYY-MM-DD" → review count
}
