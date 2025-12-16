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

  constructor() {
    this.progress = {
      streak: 0,
      totalXP: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      lastPracticeDate: null,
      achievements: [],
    };
  }

  async initialize(): Promise<void> {
    const saved = await storageService.getUserProgress();
    if (saved) {
      this.progress = saved;
      await this.updateStreak();
    }
  }

  async updateStreak(): Promise<void> {
    const lastDate = await storageService.getLastPracticeDate();
    const today = getTodayString();

    if (!lastDate) {
      // First time user
      return;
    }

    if (isToday(lastDate)) {
      // Already practiced today, streak is maintained
      return;
    }

    if (isYesterday(lastDate)) {
      // Continued streak
      this.progress.streak += 1;
    } else {
      // Streak broken
      this.progress.streak = 1;
    }

    await this.saveProgress();
  }

  async recordPractice(isCorrect: boolean): Promise<{ xpGained: number; newAchievements: Achievement[] }> {
    const today = getTodayString();
    const lastDate = await storageService.getLastPracticeDate();

    // Update streak if needed
    if (!lastDate || !isToday(lastDate)) {
      if (lastDate && isYesterday(lastDate)) {
        this.progress.streak += 1;
      } else if (lastDate && !isYesterday(lastDate)) {
        this.progress.streak = 1;
      } else {
        this.progress.streak = 1;
      }
      await storageService.saveLastPracticeDate(today);
    }

    // Update stats
    this.progress.questionsAnswered += 1;
    if (isCorrect) {
      this.progress.correctAnswers += 1;
    }

    // Calculate XP
    const xpGained = isCorrect ? XP_PER_CORRECT : XP_PER_QUESTION;
    this.progress.totalXP += xpGained;

    // Check for achievements
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

  getAchievements(): Achievement[] {
    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: this.progress.achievements.includes(ach.id),
    }));
  }

  private async saveProgress(): Promise<void> {
    await storageService.saveUserProgress(this.progress);
  }
}

export const gamificationService = new GamificationService();

