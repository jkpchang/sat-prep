import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ProgressCard } from '../components/ProgressCard';
import { AchievementBadge } from '../components/AchievementBadge';
import { gamificationService } from '../services/gamification';
import { UserProgress, Achievement } from '../types';

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type TabParamList = {
  Home: undefined;
  Progress: undefined;
};

type ProgressScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Progress'>;

interface ProgressScreenProps {
  navigation: ProgressScreenNavigationProp;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await gamificationService.initialize();
    const currentProgress = gamificationService.getProgress();
    const allAchievements = gamificationService.getAchievements();
    setProgress(currentProgress);
    setAchievements(allAchievements);
  };

  // Reload when screen comes into focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  if (!progress) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const accuracy = progress.questionsAnswered > 0
    ? Math.round((progress.correctAnswers / progress.questionsAnswered) * 100)
    : 0;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.progressGrid}>
          <ProgressCard label="Total XP" value={progress.totalXP} icon="⭐" />
          <ProgressCard label="Questions" value={progress.questionsAnswered} icon="❓" />
          <ProgressCard label="Correct" value={progress.correctAnswers} icon="✅" />
          <ProgressCard label="Accuracy" value={`${accuracy}%`} icon="🎯" />
          <ProgressCard label="Streak" value={progress.streak} icon="🔥" />
          <ProgressCard label="Achievements" value={`${unlockedCount}/${achievements.length}`} icon="🏆" />
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.map(achievement => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 60,
  },
  statsSection: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementsSection: {
    marginTop: 24,
    padding: 16,
  },
});

