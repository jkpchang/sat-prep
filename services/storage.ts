import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress } from '../types';

const STORAGE_KEYS = {
  USER_PROGRESS: '@sat_prep:user_progress',
  LAST_PRACTICE_DATE: '@sat_prep:last_practice_date',
};

export const storageService = {
  async getUserProgress(): Promise<UserProgress | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user progress:', error);
      return null;
    }
  },

  async saveUserProgress(progress: UserProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  },

  async getLastPracticeDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_PRACTICE_DATE);
    } catch (error) {
      console.error('Error loading last practice date:', error);
      return null;
    }
  },

  async saveLastPracticeDate(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PRACTICE_DATE, date);
    } catch (error) {
      console.error('Error saving last practice date:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROGRESS);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_PRACTICE_DATE);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

