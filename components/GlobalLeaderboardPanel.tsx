import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LeaderboardEntry } from "../types";

interface GlobalLeaderboardPanelProps {
  type: "xp" | "streak";
  entries: LeaderboardEntry[];
  userRank: number | null;
  currentUserId: string;
  onShowMore: () => void;
}

export const GlobalLeaderboardPanel: React.FC<GlobalLeaderboardPanelProps> = ({
  type,
  entries,
  userRank,
  currentUserId,
  onShowMore,
}) => {
  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Global Leaderboard - {type === "xp" ? "XP" : "Days Streak"}
        </Text>
        <Text style={styles.emptyText}>No entries available</Text>
      </View>
    );
  }

  const title = `Global Leaderboard - ${type === "xp" ? "XP" : "Days Streak"}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.entriesContainer}>
        {entries.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          return (
            <View
              key={entry.userId}
              style={[
                styles.entry,
                isCurrentUser && styles.currentUserEntry,
              ]}
            >
              <Text style={[styles.rank, isCurrentUser && styles.currentUserText]}>
                {entry.rank}
              </Text>
              <Text
                style={[styles.username, isCurrentUser && styles.currentUserText]}
                numberOfLines={1}
              >
                {entry.username || "Unknown"}
              </Text>
              <Text style={[styles.value, isCurrentUser && styles.currentUserText]}>
                {type === "xp" ? entry.totalXP : entry.dayStreak}
              </Text>
            </View>
          );
        })}
      </View>
      <TouchableOpacity style={styles.showMoreButton} onPress={onShowMore}>
        <Text style={styles.showMoreText}>Show More →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 12,
  },
  entriesContainer: {
    gap: 8,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  currentUserEntry: {
    backgroundColor: "#F0FDFC",
    borderWidth: 2,
    borderColor: "#4ECDC4",
  },
  rank: {
    width: 40,
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  username: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    minWidth: 60,
    textAlign: "right",
  },
  currentUserText: {
    color: "#2C3E50",
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    paddingVertical: 16,
  },
  showMoreButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#4ECDC4",
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  showMoreText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

