export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: "math" | "reading" | "writing";
  difficultyLevel: number; // 1-10 scale for adaptive difficulty
}

export interface UserProgress {
  streak: number;
  totalXP: number;
  questionsAnswered: number;
  correctAnswers: number;
  lastPracticeDate: string | null; // Deprecated: use lastQuestionDate instead
  lastQuestionDate: string | null; // Date (YYYY-MM-DD) of last question answered
  questionsAnsweredToday: number; // Count of questions answered today
  lastValidStreakDate: string | null; // Last date that counted toward streak (had 5+ questions)
  achievements: string[];
  answeredQuestionIds: string[]; // Track which questions have been answered CORRECTLY (users can retry incorrect ones)
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}
