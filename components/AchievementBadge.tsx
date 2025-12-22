import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Achievement } from "../types";
import { typography } from "../styles/typography";
import { theme } from "../theme";

interface AchievementBadgeProps {
  achievement: Achievement;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
}) => {
  return (
    <View style={[styles.container, !achievement.unlocked && styles.locked]}>
      <Text style={styles.icon}>{achievement.icon}</Text>
      <Text style={[styles.name, !achievement.unlocked && styles.lockedText]}>
        {achievement.name}
      </Text>
      <Text
        style={[styles.description, !achievement.unlocked && styles.lockedText]}
      >
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
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    margin: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: "center",
  },
  locked: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceOffWhite,
    opacity: 0.6,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  lockedText: {
    color: theme.colors.disabled,
  },
  unlockedDate: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.primary,
    marginTop: 8,
  },
});

