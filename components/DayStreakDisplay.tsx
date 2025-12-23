import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { typography } from "../styles/typography";
import { theme } from "../theme";

interface DayStreakDisplayProps {
  dayStreak: number;
  questionsAnsweredToday: number;
}

const MIN_QUESTIONS_FOR_STREAK = 5;

export const DayStreakDisplay: React.FC<DayStreakDisplayProps> = ({
  dayStreak,
  questionsAnsweredToday,
}) => {
  const isGoalMet = questionsAnsweredToday >= MIN_QUESTIONS_FOR_STREAK;

  return (
    <View style={styles.container}>
      {/* Left Zone: Day Streak */}
      <View style={[styles.leftZone, isGoalMet && styles.leftZoneFullWidth]}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <View style={styles.textContainer}>
          <Text style={styles.streakNumber}>{dayStreak}</Text>
          <Text style={styles.streakLabel}>
            {dayStreak === 1 ? "Day Streak" : "Days Streak"}
          </Text>
        </View>
      </View>

      {/* Right Zone: Questions Today or Completion Status */}
      {!isGoalMet && (
        <View style={styles.rightZone}>
          <View style={styles.textContainer}>
            <Text style={styles.questionsNumber}>
              {questionsAnsweredToday} / {MIN_QUESTIONS_FOR_STREAK}
            </Text>
            <Text style={styles.questionsLabel}>Questions Today</Text>
          </View>
        </View>
      )}
      {isGoalMet && (
        <View style={styles.rightZone}>
          <View style={styles.completeContainer}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.completeText}>Daily goal completed!</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.streak,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  leftZone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: theme.colors.whiteAlpha30,
    paddingRight: 16,
  },
  leftZoneFullWidth: {
    borderRightWidth: 0,
    paddingRight: 0,
  },
  rightZone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 16,
  },
  completeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkContainer: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  checkmark: {
    fontSize: 32,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.white,
  },
  completeText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.white,
    opacity: 0.9,
  },
  fireEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.white,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.white,
    opacity: 0.9,
  },
  questionsNumber: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.white,
    textAlign: "right",
  },
  questionsLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: "right",
  },
});
