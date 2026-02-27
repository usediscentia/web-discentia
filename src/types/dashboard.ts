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
