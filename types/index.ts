export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: "math" | "reading" | "writing";
  subcategory?: string; // Further classify each question type (e.g. "math_algebra_linear_equations")
  difficultyLevel: number; // 1-10 scale for adaptive difficulty
  imageSvg?: string; // SVG markup as string (for simple diagrams)
  imageDataUri?: string; // Base64/data-uri image (e.g. data:image/svg+xml;base64,...)
  formula?: string; // LaTeX string (for AI generation)
  renderOptionsAsSvg?: boolean; // If true, render options as SVG instead of text
  optionsSvg?: string[]; // Pre-generated SVG strings for each option (when renderOptionsAsSvg is true)
}

export interface UserProgress {
  dayStreak: number;
  totalXP: number;
  questionsAnswered: number;
  correctAnswers: number;
  answerStreak: number; // Number of questions answered correctly in a row
  lastQuestionDate: string | null; // Date (YYYY-MM-DD) of last question answered
  questionsAnsweredToday: number; // Count of questions answered today
  lastValidStreakDate: string | null; // Last date that counted toward streak (had 10+ questions)
  achievements: string[];
  answeredQuestionIds: number[]; // Track which questions have been answered CORRECTLY (users can retry incorrect ones)
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  xpReward?: number; // XP awarded when this achievement is unlocked
}

export interface LeaderboardEntry {
  userId: string;
  username: string | null;
  totalXP: number;
  dayStreak: number;
  rank: number;
}

export interface PrivateLeaderboard {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  maxMembers: number;
  memberCount: number;
}

export interface LeaderboardMember {
  userId: string;
  username: string | null;
  totalXP: number;
  dayStreak: number;
  rank: number;
  joinedAt: string;
}

export interface UserPreferences {
  userId: string;
  blockLeaderboardInvites: boolean;
  hideFromGlobalLeaderboard: boolean;
  updatedAt: string;
}
