export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: 'math' | 'reading' | 'writing';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserProgress {
  streak: number;
  totalXP: number;
  questionsAnswered: number;
  correctAnswers: number;
  lastPracticeDate: string | null;
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

