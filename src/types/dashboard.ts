export interface DashboardStats {
  dueToday: number;
  reviewedToday: number;
  streak: number;
  totalCards: number;
  masteredCards: number;
  libraryItemCount: number;
  activityByDay: Record<string, number>; // "YYYY-MM-DD" → review count
}

export interface DashboardDueByLibrary {
  libraryId: string | null;
  name: string;
  dueCount: number;
}

export interface DashboardUpcomingReview {
  label: string;
  dueCount: number;
  timestamp: number;
}

export interface DashboardActivityItem {
  id: string;
  type: "chat_message" | "exercise_completed" | "library_item_added" | "srs_review";
  description: string;
  timestamp: number;
}

export interface DashboardInsights {
  dueByLibrary: DashboardDueByLibrary[];
  upcomingReviews: DashboardUpcomingReview[];
  recentActivity: DashboardActivityItem[];
  reviewedThisMonth: number;
  reviewedLast7Days: number;
  reviewedPrev7Days: number;
  bestStreak: number;
}

export interface WeekDayData {
  label: string;       // "DOM" | "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SÁB"
  dateNumber: number;  // day of month
  dateKey: string;     // "YYYY-MM-DD"
  load: number;        // raw card count
  dotCount: number;    // 0–8, proportional
  status: "today" | "completed" | "pending" | "heavy";
}

export interface WeakSpot {
  libraryItemId: string;
  itemTitle: string;
  libraryName: string;
  libraryColor: string;
  cardCount: number;
  avgEaseFactor: number; // 1.3–2.5; lower = weaker
  totalLapses: number;
  weakScore: number; // 0.0–1.0; higher = weaker
}
