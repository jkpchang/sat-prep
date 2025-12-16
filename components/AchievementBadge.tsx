import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Achievement } from '../types';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement }) => {
  return (
    <View style={[styles.container, !achievement.unlocked && styles.locked]}>
      <Text style={styles.icon}>{achievement.icon}</Text>
      <Text style={[styles.name, !achievement.unlocked && styles.lockedText]}>
        {achievement.name}
      </Text>
      <Text style={[styles.description, !achievement.unlocked && styles.lockedText]}>
        {achievement.description}
      </Text>
      {achievement.unlocked && achievement.unlockedDate && (
        <Text style={styles.unlockedDate}>
          Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    margin: 8,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    alignItems: 'center',
  },
  locked: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  lockedText: {
    color: '#BDC3C7',
  },
  unlockedDate: {
    fontSize: 10,
    color: '#4ECDC4',
    marginTop: 8,
    fontWeight: '600',
  },
});

