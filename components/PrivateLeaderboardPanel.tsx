import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { PrivateLeaderboard, LeaderboardMember } from "../types";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import { AppIcon } from "./AppIcon";

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

export const PrivateLeaderboardPanel: React.FC<
  PrivateLeaderboardPanelProps
> = ({
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
              <AppIcon name="ui.refresh" tone="muted" size="sm" />
            </TouchableOpacity>
          )}
          {isOwner && onManage && (
            <TouchableOpacity style={styles.manageButton} onPress={onManage}>
              <AppIcon name="ui.settings" tone="muted" size="sm" />
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
            <View style={styles.tabContent}>
              <AppIcon
                name="stat.xp"
                tone={sortBy === "xp" ? "xp" : "muted"}
                size="xs"
              />
              <Text
                style={[styles.tabText, sortBy === "xp" && styles.activeTabText]}
              >
                XP
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, sortBy === "streak" && styles.activeTab]}
            onPress={() => setSortBy("streak")}
          >
            <View style={styles.tabContent}>
              <AppIcon
                name="stat.dayStreak"
                tone={sortBy === "streak" ? "dayStreak" : "muted"}
                size="xs"
              />
              <Text
                style={[
                  styles.tabText,
                  sortBy === "streak" && styles.activeTabText,
                ]}
              >
                Streak
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.entriesContainer}>
        {sortedEntries.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          return (
            <TouchableOpacity
              key={entry.userId}
              style={[styles.entry, isCurrentUser && styles.currentUserEntry]}
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
              <View style={styles.valueWrap}>
                <AppIcon
                  name={sortBy === "xp" ? "stat.xp" : "stat.dayStreak"}
                  tone={sortBy === "xp" ? "xp" : "dayStreak"}
                  size="xs"
                />
                <Text
                  style={[
                    styles.valueNumber,
                    isCurrentUser && styles.currentUserText,
                  ]}
                >
                  {sortBy === "xp" ? entry.totalXP : entry.dayStreak}
                </Text>
              </View>
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: theme.shadow.color,
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
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
  },
  manageButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
  },
  tabsContainer: {
    marginBottom: 12,
    backgroundColor: theme.colors.surfaceSubtle,
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
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    backgroundColor: theme.colors.surfaceSubtle,
  },
  currentUserEntry: {
    backgroundColor: theme.colors.tintMint,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  rank: {
    width: 40,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text,
    marginLeft: 12,
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 60,
    justifyContent: "flex-end",
  },
  valueNumber: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: "right",
    lineHeight: 20,
  },
  currentUserText: {
    color: theme.colors.text,
    fontFamily: typography.fontFamily.bold,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
  showMoreButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  showMoreText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
});
