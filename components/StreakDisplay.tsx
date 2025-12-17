import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StreakDisplayProps {
  streak: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.fireEmoji}>🔥</Text>
      <View style={styles.textContainer}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>
          {streak === 1 ? "Day Streak" : "Days Streak"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
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
});
