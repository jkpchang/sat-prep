import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.completeText}>Complete!</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FF6B6B",
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  leftZone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.3)",
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
  checkmark: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  completeText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
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
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  streakLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  questionsNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "right",
  },
  questionsLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "right",
  },
});
