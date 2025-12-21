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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

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
        <Text style={styles.headerTitle}>
          Global - {type === "xp" ? "⭐ XP" : "🔥 Days Streak"}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading && topEntries.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4ECDC4" />
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
                    <Text
                      style={[
                        styles.value,
                        isCurrentUser && styles.currentUserText,
                      ]}
                    >
                      <Text style={styles.valueIcon}>
                        {type === "xp" ? "⭐" : "🔥"}
                      </Text>
                      {type === "xp" ? entry.totalXP : entry.dayStreak}
                    </Text>
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
                    <Text
                      style={[
                        styles.value,
                        isCurrentUser && styles.currentUserText,
                      ]}
                    >
                      <Text style={styles.valueIcon}>
                        {type === "xp" ? "⭐" : "🔥"}
                      </Text>
                      {type === "xp" ? entry.totalXP : entry.dayStreak}
                    </Text>
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
    backgroundColor: "#E8ECF0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: "#4ECDC4",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
  },
  placeholder: {
    width: 60,
  },
  refreshButton: {
    paddingVertical: 4,
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
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserEntry: {
    backgroundColor: "#F0FDFC",
    borderWidth: 2,
    borderColor: "#4ECDC4",
  },
  rank: {
    width: 50,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
  },
  valueIcon: {
    fontSize: 16,
    marginRight: 3,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 16,
    marginHorizontal: 16,
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: "#2C3E50",
    marginLeft: 12,
  },
  value: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
    minWidth: 80,
    textAlign: "right",
    lineHeight: 22,
  },
  currentUserText: {
    color: "#2C3E50",
    fontFamily: typography.fontFamily.bold,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: "#7F8C8D",
    textAlign: "center",
  },
});
