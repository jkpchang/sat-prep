import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LeaderboardEntry } from "../types";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import { AppIcon } from "./AppIcon";

interface GlobalLeaderboardPanelProps {
  type: "xp" | "streak";
  entries: LeaderboardEntry[];
  userRank: number | null;
  currentUserId: string;
  onShowMore: () => void;
  onRefresh?: () => void;
  onEntryPress?: (userId: string) => void;
}

export const GlobalLeaderboardPanel: React.FC<GlobalLeaderboardPanelProps> = ({
  type,
  entries,
  userRank,
  currentUserId,
  onShowMore,
  onRefresh,
  onEntryPress,
}) => {
  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Global Leaderboard -</Text>
          <View style={styles.titleMetric}>
            <AppIcon
              name={type === "xp" ? "stat.xp" : "stat.dayStreak"}
              tone={type === "xp" ? "xp" : "dayStreak"}
              size="sm"
            />
            <Text style={styles.titleMetricText}>
              {type === "xp" ? "XP" : "Days Streak"}
            </Text>
          </View>
        </View>
        <Text style={styles.emptyText}>No entries available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Global Leaderboard -</Text>
          <View style={styles.titleMetric}>
            <AppIcon
              name={type === "xp" ? "stat.xp" : "stat.dayStreak"}
              tone={type === "xp" ? "xp" : "dayStreak"}
              size="sm"
            />
            <Text style={styles.titleMetricText}>
              {type === "xp" ? "XP" : "Days Streak"}
            </Text>
          </View>
        </View>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <AppIcon name="ui.refresh" tone="muted" size="sm" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.entriesContainer}>
        {entries.map((entry) => {
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
              <Text style={[styles.rank, isCurrentUser && styles.currentUserText]}>
                {entry.rank}
              </Text>
              <Text
                style={[styles.username, isCurrentUser && styles.currentUserText]}
                numberOfLines={1}
              >
                {entry.username || "Unknown"}
              </Text>
              <View style={styles.valueWrap}>
                <AppIcon
                  name={type === "xp" ? "stat.xp" : "stat.dayStreak"}
                  tone={type === "xp" ? "xp" : "dayStreak"}
                  size="xs"
                />
                <Text style={[styles.valueNumber, isCurrentUser && styles.currentUserText]}>
                  {type === "xp" ? entry.totalXP : entry.dayStreak}
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
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingRight: 8,
  },
  titleText: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  titleMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titleMetricText: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
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

