export interface SRSCard {
  id: string;
  libraryItemId?: string;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: number;
  lastReviewDate: number | null;
  lapses: number;
  createdAt: number;
}

export type SRSRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface ActivityEvent {
  id: string;
  type:
    | "chat_message"
    | "exercise_completed"
    | "library_item_added"
    | "srs_review";
  description: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}
