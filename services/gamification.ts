import { UserProgress, Achievement } from '../types';
import { storageService } from './storage';
import { isToday, isYesterday, getTodayString } from '../utils/dateUtils';

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_question', name: 'Getting Started', description: 'Answer your first question', icon: '🎯', unlocked: false },
  { id: 'streak_3', name: 'On a Roll', description: 'Maintain a 3-day streak', icon: '🔥', unlocked: false },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '💪', unlocked: false },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '👑', unlocked: false },
  { id: 'perfect_10', name: 'Perfect Score', description: 'Get 10 questions correct in a row', icon: '⭐', unlocked: false },
  { id: 'xp_1000', name: 'Knowledge Seeker', description: 'Earn 1000 XP', icon: '📚', unlocked: false },
];

const XP_PER_CORRECT = 10;
const XP_PER_QUESTION = 5; // Even for wrong answers

export class GamificationService {
  private progress: UserProgress;
  // Use Set for O(1) lookups instead of array.includes() which is O(n)
  private answeredQuestionIdsSet: Set<string>;
  private readonly MAX_ANSWERED_QUESTIONS = 10000; // Limit to prevent unbounded growth

  constructor() {
    this.progress = {
      streak: 0,
      totalXP: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      lastPracticeDate: null,
      achievements: [],
      answeredQuestionIds: [],
    };
    this.answeredQuestionIdsSet = new Set<string>();
  }

  async initialize(): Promise<void> {
    const saved = await storageService.getUserProgress();
    if (saved) {
      this.progress = {
        ...saved,
        answeredQuestionIds: saved.answeredQuestionIds || [],
      };
      this.answeredQuestionIdsSet = new Set(this.progress.answeredQuestionIds);
      this.trimAnsweredQuestionsIfNeeded();
      await this.updateStreak();
    } else {
      this.progress.answeredQuestionIds = [];
      this.answeredQuestionIdsSet = new Set<string>();
    }
  }

  private trimAnsweredQuestionsIfNeeded(): void {
    if (this.answeredQuestionIdsSet.size > this.MAX_ANSWERED_QUESTIONS) {
      const idsArray = Array.from(this.answeredQuestionIdsSet);
      const trimmed = idsArray.slice(-this.MAX_ANSWERED_QUESTIONS);
      this.answeredQuestionIdsSet = new Set(trimmed);
      this.progress.answeredQuestionIds = trimmed;
    }
  }

  async updateStreak(): Promise<void> {
    const lastDate = await storageService.getLastPracticeDate();
    const today = getTodayString();

    if (!lastDate) {
      this.progress.streak = 0;
      await this.saveProgress();
      return;
    }

    if (isToday(lastDate)) {
      return;
    }

    if (!isYesterday(lastDate)) {
      this.progress.streak = 0;
      await this.saveProgress();
    }
  }

  async recordPractice(isCorrect: boolean, questionId?: string): Promise<{ xpGained: number; newAchievements: Achievement[] }> {
    const today = getTodayString();
    const lastDate = await storageService.getLastPracticeDate();

    const isFirstPracticeToday = !lastDate || !isToday(lastDate);
    
    if (isFirstPracticeToday) {
      if (!lastDate) {
        this.progress.streak = 1;
      } else if (isYesterday(lastDate)) {
        this.progress.streak += 1;
      } else {
        this.progress.streak = 1;
      }
      await storageService.saveLastPracticeDate(today);
    }

    if (questionId && isCorrect && !this.answeredQuestionIdsSet.has(questionId)) {
      this.answeredQuestionIdsSet.add(questionId);
      this.progress.answeredQuestionIds.push(questionId);
      this.trimAnsweredQuestionsIfNeeded();
    }

    this.progress.questionsAnswered += 1;
    if (isCorrect) {
      this.progress.correctAnswers += 1;
    }

    const xpGained = isCorrect ? XP_PER_CORRECT : XP_PER_QUESTION;
    this.progress.totalXP += xpGained;

    const newAchievements = await this.checkAchievements();

    this.progress.lastPracticeDate = today;
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
        case 'first_question':
          shouldUnlock = this.progress.questionsAnswered >= 1;
          break;
        case 'streak_3':
          shouldUnlock = this.progress.streak >= 3;
          break;
        case 'streak_7':
          shouldUnlock = this.progress.streak >= 7;
          break;
        case 'streak_30':
          shouldUnlock = this.progress.streak >= 30;
          break;
        case 'xp_1000':
          shouldUnlock = this.progress.totalXP >= 1000;
          break;
        // perfect_10 would need additional tracking
      }

      if (shouldUnlock) {
        this.progress.achievements.push(achievement.id);
        newAchievements.push({ ...achievement, unlocked: true, unlockedDate: new Date().toISOString() });
      }
    }

    return newAchievements;
  }

  getProgress(): UserProgress {
    return { ...this.progress };
  }

  getAnsweredQuestionIds(): string[] {
    return Array.from(this.answeredQuestionIdsSet);
  }

  hasAnsweredQuestion(questionId: string): boolean {
    return this.answeredQuestionIdsSet.has(questionId);
  }

  getAchievements(): Achievement[] {
    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: this.progress.achievements.includes(ach.id),
    }));
  }

  private async saveProgress(): Promise<void> {
    this.progress.answeredQuestionIds = Array.from(this.answeredQuestionIdsSet);
    await storageService.saveUserProgress(this.progress);
  }
}

export const gamificationService = new GamificationService();

