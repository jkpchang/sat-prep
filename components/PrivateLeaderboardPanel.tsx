import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { PrivateLeaderboard, LeaderboardMember } from "../types";

interface PrivateLeaderboardPanelProps {
  leaderboard: PrivateLeaderboard;
  entries: LeaderboardMember[];
  userRank: number | null;
  currentUserId: string;
  onShowMore: () => void;
  onManage?: () => void;
  onRefresh?: () => void;
  onEntryPress?: (userId: string) => void;
  isOwner: boolean;
}

export const PrivateLeaderboardPanel: React.FC<PrivateLeaderboardPanelProps> = ({
  leaderboard,
  entries,
  userRank,
  currentUserId,
  onShowMore,
  onManage,
  onRefresh,
  onEntryPress,
  isOwner,
}) => {
  const [sortBy, setSortBy] = useState<"xp" | "streak">("xp");

  // Sort entries based on current sort
  const sortedEntries = [...entries]
    .sort((a, b) => {
      if (sortBy === "xp") {
        return b.totalXP - a.totalXP;
      } else {
        return b.dayStreak - a.dayStreak;
      }
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  if (sortedEntries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{leaderboard.name}</Text>
        <Text style={styles.emptyText}>No members yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{leaderboard.name}</Text>
          {leaderboard.description && (
            <Text style={styles.description}>{leaderboard.description}</Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          {onRefresh && (
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          )}
          {isOwner && onManage && (
            <TouchableOpacity style={styles.manageButton} onPress={onManage}>
              <Text style={styles.manageButtonIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, sortBy === "xp" && styles.activeTab]}
            onPress={() => setSortBy("xp")}
          >
            <Text
              style={[styles.tabText, sortBy === "xp" && styles.activeTabText]}
            >
              ⭐ XP
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, sortBy === "streak" && styles.activeTab]}
            onPress={() => setSortBy("streak")}
          >
            <Text
              style={[
                styles.tabText,
                sortBy === "streak" && styles.activeTabText,
              ]}
            >
              🔥 Streak
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.entriesContainer}>
        {sortedEntries.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          return (
            <TouchableOpacity
              key={entry.userId}
              style={[
                styles.entry,
                isCurrentUser && styles.currentUserEntry,
              ]}
              onPress={() => onEntryPress?.(entry.userId)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.rank, isCurrentUser && styles.currentUserText]}
              >
                {entry.rank}
              </Text>
              <Text
                style={[
                  styles.username,
                  isCurrentUser && styles.currentUserText,
                ]}
                numberOfLines={1}
              >
                {entry.username || "Unknown"}
              </Text>
              <Text
                style={[styles.value, isCurrentUser && styles.currentUserText]}
              >
                <Text style={styles.valueIcon}>
                  {sortBy === "xp" ? "⭐" : "🔥"}
                </Text>
                {sortBy === "xp" ? entry.totalXP : entry.dayStreak}
              </Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
  },
  refreshIcon: {
    fontSize: 18,
  },
  manageButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
  },
  manageButtonIcon: {
    fontSize: 18,
  },
  tabsContainer: {
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 4,
  },
  tabs: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  activeTabText: {
    color: "#4ECDC4",
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
    lineHeight: 20,
  },
  valueIcon: {
    fontSize: 14,
    marginRight: 3,
    lineHeight: 20,
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

