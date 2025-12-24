import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  getGlobalLeaderboardViewByXP,
  getGlobalLeaderboardViewByStreak,
} from "../services/leaderboard";
import { LeaderboardEntry } from "../types";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppIcon } from "../components/AppIcon";

type RootStackParamList = {
  Main: undefined;
  Quiz: undefined;
  Leaderboard: undefined;
  GlobalLeaderboard: { type: "xp" | "streak" };
  PrivateLeaderboard: { leaderboardId: string };
  UserProfile: { userId: string };
};

type GlobalLeaderboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "GlobalLeaderboard"
>;

interface GlobalLeaderboardScreenProps {
  navigation: GlobalLeaderboardScreenNavigationProp;
  route: { params: { type: "xp" | "streak" } };
}

export const GlobalLeaderboardScreen: React.FC<
  GlobalLeaderboardScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { authProfile } = useAuth();
  const { type } = route.params;

  const {
    data: leaderboardData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["globalLeaderboardView", type, authProfile?.userId],
    queryFn: async () => {
      if (!authProfile?.userId) {
        return {
          topEntries: [],
          userEntry: null,
          userRank: null,
          surroundingEntries: [],
        };
      }
      return type === "xp"
        ? getGlobalLeaderboardViewByXP(authProfile.userId)
        : getGlobalLeaderboardViewByStreak(authProfile.userId);
    },
    enabled: !!authProfile?.userId,
  });

  const topEntries = leaderboardData?.topEntries || [];
  const userEntry = leaderboardData?.userEntry || null;
  const userRank = leaderboardData?.userRank ?? null;
  const surroundingEntries = leaderboardData?.surroundingEntries || [];

  const handleRowClick = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>&lt; Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitleText}>Global -</Text>
          <View style={styles.headerMetric}>
            <AppIcon
              name={type === "xp" ? "stat.xp" : "stat.dayStreak"}
              tone={type === "xp" ? "xp" : "dayStreak"}
              size="sm"
            />
            <Text style={styles.headerTitleText}>
              {type === "xp" ? "XP" : "Days Streak"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
        >
          <AppIcon name="ui.refresh" tone="muted" size="sm" />
        </TouchableOpacity>
      </View>

      {loading && topEntries.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {/* Top 10 */}
          {topEntries.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top 10</Text>
              {topEntries.map((entry) => {
                const isCurrentUser = entry.userId === authProfile?.userId;
                return (
                  <TouchableOpacity
                    key={entry.userId}
                    style={[
                      styles.entry,
                      isCurrentUser && styles.currentUserEntry,
                    ]}
                    onPress={() => handleRowClick(entry.userId)}
                  >
                    <Text
                      style={[
                        styles.rank,
                        isCurrentUser && styles.currentUserText,
                      ]}
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
                        name={type === "xp" ? "stat.xp" : "stat.dayStreak"}
                        tone={type === "xp" ? "xp" : "dayStreak"}
                        size="xs"
                      />
                      <Text
                        style={[
                          styles.valueNumber,
                          isCurrentUser && styles.currentUserText,
                        ]}
                      >
                        {type === "xp" ? entry.totalXP : entry.dayStreak}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* User's position (if not in top 10) */}
          {userRank && userRank > 10 && surroundingEntries.length > 0 && (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionTitle}>Your Position</Text>
              {surroundingEntries.map((entry) => {
                const isCurrentUser = entry.userId === authProfile?.userId;
                return (
                  <TouchableOpacity
                    key={entry.userId}
                    style={[
                      styles.entry,
                      isCurrentUser && styles.currentUserEntry,
                    ]}
                    onPress={() => handleRowClick(entry.userId)}
                  >
                    <Text
                      style={[
                        styles.rank,
                        isCurrentUser && styles.currentUserText,
                      ]}
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
                        name={type === "xp" ? "stat.xp" : "stat.dayStreak"}
                        tone={type === "xp" ? "xp" : "dayStreak"}
                        size="xs"
                      />
                      <Text
                        style={[
                          styles.valueNumber,
                          isCurrentUser && styles.currentUserText,
                        ]}
                      >
                        {type === "xp" ? entry.totalXP : entry.dayStreak}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {topEntries.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No entries available</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundAlt,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  headerTitleText: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  headerMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  placeholder: {
    width: 60,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserEntry: {
    backgroundColor: theme.colors.tintMint,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  rank: {
    width: 50,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
    marginHorizontal: 16,
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
    minWidth: 80,
    justifyContent: "flex-end",
  },
  valueNumber: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: "right",
    lineHeight: 22,
  },
  currentUserText: {
    color: theme.colors.text,
    fontFamily: typography.fontFamily.bold,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
