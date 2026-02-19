export type ExerciseType =
  | "flashcard"
  | "quiz"
  | "crossword"
  | "connections"
  | "sprint"
  | "fillgap"
  | "bossfight";

export interface FlashcardData {
  cards: Array<{ id: string; front: string; back: string; hint?: string }>;
}

export interface QuizData {
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
}

export interface SprintData {
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
  }>;
  timePerQuestion: number;
}

export interface FillGapData {
  passage: string;
  gaps: Array<{ id: string; answer: string; position: number }>;
  wordBank: string[];
}

export interface ConnectionsData {
  groups: Array<{
    category: string;
    words: string[];
    difficulty: 1 | 2 | 3 | 4;
    color: string;
  }>;
}

export interface CrosswordData {
  size: { rows: number; cols: number };
  clues: Array<{
    direction: "across" | "down";
    number: number;
    clue: string;
    answer: string;
    startRow: number;
    startCol: number;
  }>;
}

export interface BossFightData {
  bossName: string;
  totalHP: number;
  rounds: Array<{
    id: string;
    type: "multiple_choice" | "free_form" | "fill_gap";
    question: string;
    options?: string[];
    correctAnswer: string;
    isLeech: boolean;
    damage: number;
    hints: string[];
  }>;
  playerLives: number;
}

export interface ExerciseResult {
  id: string;
  exerciseId: string;
  score: number;
  details: { total: number; correct: number; wrong: number; skipped: number };
  duration: number;
  completedAt: number;
}

export interface Exercise {
  id: string;
  messageId: string;
  type: ExerciseType;
  title: string;
  data:
    | FlashcardData
    | QuizData
    | SprintData
    | FillGapData
    | ConnectionsData
    | CrosswordData
    | BossFightData;
  results: ExerciseResult[];
  createdAt: number;
}
