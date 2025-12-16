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
      // First time user - streak should be 0
      this.progress.streak = 0;
      await this.saveProgress();
      return;
    }

    if (isToday(lastDate)) {
      // Already practiced today, streak is maintained
      return;
    }

    // If last practice was more than 1 day ago, streak is broken
    if (!isYesterday(lastDate)) {
      // Streak broken - reset to 0 (will become 1 when they practice today)
      this.progress.streak = 0;
      await this.saveProgress();
    }
    // If last practice was yesterday, keep current streak
    // It will be incremented when user practices today in recordPractice()
  }

  async recordPractice(isCorrect: boolean): Promise<{ xpGained: number; newAchievements: Achievement[] }> {
    const today = getTodayString();
    const lastDate = await storageService.getLastPracticeDate();

    // Update streak ONLY if this is the first practice of the day
    // This ensures streak increments once per day, not once per practice session
    const isFirstPracticeToday = !lastDate || !isToday(lastDate);
    
    if (isFirstPracticeToday) {
      if (!lastDate) {
        // First time ever practicing
        this.progress.streak = 1;
      } else if (isYesterday(lastDate)) {
        // Continued streak from yesterday - increment by 1
        this.progress.streak += 1;
      } else {
        // Gap in practice (more than 1 day) - start new streak
        this.progress.streak = 1;
      }
      // Save today's date to prevent multiple increments today
      await storageService.saveLastPracticeDate(today);
    }
    // If already practiced today, streak stays the same (no increment)

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

