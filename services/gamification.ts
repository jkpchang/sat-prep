import { UserProgress, Achievement } from "../types";
import { storageService } from "./storage";
import { scheduleSaveProfileStats } from "./profileSync";
import { isToday, isYesterday, getTodayString } from "../utils/dateUtils";

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_question",
    name: "Getting Started",
    description: "Answer your first question",
    icon: "🎯",
    unlocked: false,
  },
  {
    id: "streak_3",
    name: "On a Roll",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    unlocked: false,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "💪",
    unlocked: false,
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "👑",
    unlocked: false,
  },
  {
    id: "answer_streak_5",
    name: "On a Roll",
    description: "Get 5 questions correct in a row",
    icon: "⚡",
    unlocked: false,
  },
  {
    id: "answer_streak_10",
    name: "On Fire",
    description: "Get 10 questions correct in a row",
    icon: "🔥",
    unlocked: false,
  },
  {
    id: "answer_streak_20",
    name: "Unstoppable",
    description: "Get 20 questions correct in a row",
    icon: "🏅",
    unlocked: false,
  },
  {
    id: "xp_1000",
    name: "Knowledge Seeker",
    description: "Earn 1000 XP",
    icon: "📚",
    unlocked: false,
  },
];

const XP_PER_CORRECT = 10;
const XP_PER_QUESTION = 5; // Even for wrong answers
const MIN_QUESTIONS_FOR_STREAK = 5; // Minimum questions per day to count toward streak

export class GamificationService {
  private progress: UserProgress;
  // Use Set for O(1) lookups instead of array.includes() which is O(n)
  private answeredQuestionIdsSet: Set<number>;
  private readonly MAX_ANSWERED_QUESTIONS = 10000; // Limit to prevent unbounded growth

  constructor() {
    this.progress = {
      dayStreak: 0,
      totalXP: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      answerStreak: 0,
      lastQuestionDate: null,
      questionsAnsweredToday: 0,
      lastValidStreakDate: null,
      achievements: [],
      answeredQuestionIds: [],
    };
    this.answeredQuestionIdsSet = new Set<number>();
  }

  async initialize(): Promise<void> {
    const saved = await storageService.getUserProgress();
    if (saved) {
      this.progress = {
        ...saved,
        dayStreak: saved.dayStreak ?? (saved as any).streak ?? 0,
        answerStreak: saved.answerStreak ?? 0,
        answeredQuestionIds: saved.answeredQuestionIds || [],
        lastQuestionDate: saved.lastQuestionDate || null,
        questionsAnsweredToday: saved.questionsAnsweredToday || 0,
        lastValidStreakDate: saved.lastValidStreakDate || null,
      };
      this.answeredQuestionIdsSet = new Set(this.progress.answeredQuestionIds);
      this.trimAnsweredQuestionsIfNeeded();
      await this.validateStreakOnStart();
    } else {
      this.reset();
    }
  }

  reset(): void {
    this.progress = {
      dayStreak: 0,
      totalXP: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      answerStreak: 0,
      lastQuestionDate: null,
      questionsAnsweredToday: 0,
      lastValidStreakDate: null,
      achievements: [],
      answeredQuestionIds: [],
    };
    this.answeredQuestionIdsSet = new Set<number>();
  }

  private trimAnsweredQuestionsIfNeeded(): void {
    if (this.answeredQuestionIdsSet.size > this.MAX_ANSWERED_QUESTIONS) {
      const idsArray = Array.from(this.answeredQuestionIdsSet);
      const trimmed = idsArray.slice(-this.MAX_ANSWERED_QUESTIONS);
      this.answeredQuestionIdsSet = new Set(trimmed);
      this.progress.answeredQuestionIds = trimmed;
    }
  }

  async validateStreakOnStart(): Promise<void> {
    const today = getTodayString();
    const lastQuestionDate = this.progress.lastQuestionDate;
    const lastValidDate = this.progress.lastValidStreakDate;

    // Reset daily counter if not today
    if (!lastQuestionDate || !isToday(lastQuestionDate)) {
      this.progress.questionsAnsweredToday = 0;
    }

    // Check if streak is broken
    if (lastValidDate) {
      if (isToday(lastValidDate)) {
        // Streak is still valid (completed today)
        return;
      } else if (isYesterday(lastValidDate)) {
        // Last valid day was yesterday - streak still active
        // But need to complete today to continue
        return;
      } else {
        // More than 1 day gap - streak broken
        this.progress.dayStreak = 0;
        this.progress.lastValidStreakDate = null;
        await this.saveProgress();
      }
    } else if (
      lastQuestionDate &&
      !isToday(lastQuestionDate) &&
      !isYesterday(lastQuestionDate)
    ) {
      // No valid streak date but last question was more than 1 day ago
      this.progress.dayStreak = 0;
      await this.saveProgress();
    }
  }

  async updateStreakForDay(date: string): Promise<void> {
    const lastValidDate = this.progress.lastValidStreakDate;

    if (!lastValidDate) {
      // First time hitting 5 questions - start streak
      this.progress.dayStreak = 1;
      this.progress.lastValidStreakDate = date;
    } else if (isYesterday(lastValidDate)) {
      // Consecutive day - increment streak
      this.progress.dayStreak += 1;
      this.progress.lastValidStreakDate = date;
    } else if (isToday(lastValidDate)) {
      // Same day - don't increment (already counted)
      // Do nothing
    } else {
      // Gap in streak - reset
      this.progress.dayStreak = 1;
      this.progress.lastValidStreakDate = date;
    }

    await this.saveProgress();
  }

  async recordPractice(
    isCorrect: boolean,
    questionId?: number
  ): Promise<{ xpGained: number; newAchievements: Achievement[] }> {
    const today = getTodayString();
    const lastQuestionDate = this.progress.lastQuestionDate;

    // Reset daily counter if new day
    if (!lastQuestionDate || !isToday(lastQuestionDate)) {
      this.progress.questionsAnsweredToday = 0;
    }

    // Increment today's count
    this.progress.questionsAnsweredToday += 1;
    this.progress.lastQuestionDate = today;

    // Check if we've hit the 5-question threshold
    if (this.progress.questionsAnsweredToday === MIN_QUESTIONS_FOR_STREAK) {
      // This day now counts toward streak
      await this.updateStreakForDay(today);
    }

    if (
      questionId &&
      isCorrect &&
      !this.answeredQuestionIdsSet.has(questionId)
    ) {
      this.answeredQuestionIdsSet.add(questionId);
      this.progress.answeredQuestionIds.push(questionId);
      this.trimAnsweredQuestionsIfNeeded();
    }

    this.progress.questionsAnswered += 1;
    if (isCorrect) {
      this.progress.correctAnswers += 1;
      // Update per-question answer streak
      this.progress.answerStreak = (this.progress.answerStreak || 0) + 1;
    } else {
      // Reset streak on incorrect answer
      this.progress.answerStreak = 0;
    }

    const xpGained = isCorrect ? XP_PER_CORRECT : XP_PER_QUESTION;
    this.progress.totalXP += xpGained;

    const newAchievements = await this.checkAchievements();

    await this.saveProgress();

    return { xpGained, newAchievements };
  }

  private async checkAchievements(): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      if (this.progress.achievements.includes(achievement.id)) {
        continue; // Already unlocked
      }

      let shouldUnlock = false;

      switch (achievement.id) {
        case "first_question":
          shouldUnlock = this.progress.questionsAnswered >= 1;
          break;
        case "streak_3":
          shouldUnlock = this.progress.dayStreak >= 3;
          break;
        case "streak_7":
          shouldUnlock = this.progress.dayStreak >= 7;
          break;
        case "streak_30":
          shouldUnlock = this.progress.dayStreak >= 30;
          break;
        case "xp_1000":
          shouldUnlock = this.progress.totalXP >= 1000;
          break;
        case "answer_streak_5":
          shouldUnlock = (this.progress.answerStreak || 0) >= 5;
          break;
        case "answer_streak_10":
          shouldUnlock = (this.progress.answerStreak || 0) >= 10;
          break;
        case "answer_streak_20":
          shouldUnlock = (this.progress.answerStreak || 0) >= 20;
          break;
      }

      if (shouldUnlock) {
        this.progress.achievements.push(achievement.id);
        newAchievements.push({
          ...achievement,
          unlocked: true,
          unlockedDate: new Date().toISOString(),
        });
      }
    }

    return newAchievements;
  }

  getProgress(): UserProgress {
    return { ...this.progress };
  }

  getAnsweredQuestionIds(): number[] {
    return Array.from(this.answeredQuestionIdsSet);
  }

  hasAnsweredQuestion(questionId: number): boolean {
    return this.answeredQuestionIdsSet.has(questionId);
  }

  getAchievements(): Achievement[] {
    return ACHIEVEMENTS.map((ach) => ({
      ...ach,
      unlocked: this.progress.achievements.includes(ach.id),
    }));
  }

  private async saveProgress(): Promise<void> {
    this.progress.answeredQuestionIds = Array.from(this.answeredQuestionIdsSet);
    await storageService.saveUserProgress(this.progress);
    // Schedule a debounced save to Supabase so we don't write on every tiny change
    scheduleSaveProfileStats({
      dayStreak: this.progress.dayStreak,
      totalXP: this.progress.totalXP,
      questionsAnswered: this.progress.questionsAnswered,
      correctAnswers: this.progress.correctAnswers,
      answerStreak: this.progress.answerStreak,
      lastQuestionDate: this.progress.lastQuestionDate,
      questionsAnsweredToday: this.progress.questionsAnsweredToday,
      lastValidStreakDate: this.progress.lastValidStreakDate,
      achievements: this.progress.achievements,
      answeredQuestionIds: this.progress.answeredQuestionIds,
    });
  }
}

export const gamificationService = new GamificationService();
