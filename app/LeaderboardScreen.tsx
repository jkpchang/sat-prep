import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { GlobalLeaderboardPanel } from "../components/GlobalLeaderboardPanel";
import { PrivateLeaderboardPanel } from "../components/PrivateLeaderboardPanel";
import { CreateLeaderboardModal } from "../components/CreateLeaderboardModal";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import {
  getGlobalLeaderboardByXP,
  getGlobalLeaderboardByStreak,
  getUserGlobalRankByXP,
  getUserGlobalRankByStreak,
  getPrivateLeaderboardsForUser,
  getPrivateLeaderboardMembers,
  getUserRankInPrivateLeaderboard,
} from "../services/leaderboard";
import {
  LeaderboardEntry,
  PrivateLeaderboard,
  LeaderboardMember,
} from "../types";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type TabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Progress: undefined;
  Profile: undefined;
};

type RootStackParamList = {
  Main: TabParamList;
  Quiz: undefined;
  GlobalLeaderboard: { type: "xp" | "streak" };
  PrivateLeaderboard: { leaderboardId: string };
  UserProfile: { userId: string };
};

type LeaderboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Leaderboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface LeaderboardScreenProps {
  navigation: LeaderboardScreenNavigationProp;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { authProfile } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Query for global XP leaderboard
  const {
    data: globalXPData,
    isLoading: loadingXP,
    refetch: refetchGlobalXP,
  } = useQuery({
    queryKey: ["globalLeaderboard", "xp", authProfile?.userId],
    queryFn: async () => {
      if (!authProfile?.userId) return null;
      const xpRankData = await getUserGlobalRankByXP(authProfile.userId);
      if (xpRankData) {
        return xpRankData;
      } else {
        // User not in leaderboard, get top 5
        const topXP = await getGlobalLeaderboardByXP(5, 0);
        return { entries: topXP, rank: null };
      }
    },
    enabled: !!authProfile?.userId && !!authProfile?.username,
  });

  // Query for global Streak leaderboard
  const {
    data: globalStreakData,
    isLoading: loadingStreak,
    refetch: refetchGlobalStreak,
  } = useQuery({
    queryKey: ["globalLeaderboard", "streak", authProfile?.userId],
    queryFn: async () => {
      if (!authProfile?.userId) return null;
      const streakRankData = await getUserGlobalRankByStreak(
        authProfile.userId
      );
      if (streakRankData) {
        return streakRankData;
      } else {
        // User not in leaderboard, get top 5
        const topStreak = await getGlobalLeaderboardByStreak(5, 0);
        return { entries: topStreak, rank: null };
      }
    },
    enabled: !!authProfile?.userId && !!authProfile?.username,
  });

  // Query for private leaderboards
  const {
    data: privateLeaderboards,
    isLoading: loadingPrivate,
    refetch: refetchPrivateLeaderboards,
  } = useQuery({
    queryKey: ["privateLeaderboards", authProfile?.userId],
    queryFn: async () => {
      if (!authProfile?.userId) return [];
      const privateLbs = await getPrivateLeaderboardsForUser(
        authProfile.userId
      );
      const privateLbData = await Promise.all(
        privateLbs.map(async (lb) => {
          const rankData = await getUserRankInPrivateLeaderboard(
            lb.id,
            authProfile.userId,
            "xp"
          );
          if (rankData && rankData.entries.length > 0) {
            // User is in leaderboard - show user in middle (up to 5 entries)
            return {
              leaderboard: lb,
              entries: rankData.entries,
              userRank: rankData.rank,
            };
          } else {
            // User not in leaderboard or no entries - show top 5
            const members = await getPrivateLeaderboardMembers(lb.id, "xp");
            return {
              leaderboard: lb,
              entries: members.slice(0, 5),
              userRank: null,
            };
          }
        })
      );
      return privateLbData;
    },
    enabled: !!authProfile?.userId && !!authProfile?.username,
  });

  const loading = loadingXP || loadingStreak || loadingPrivate;
  const globalXPEntries = globalXPData?.entries || [];
  const globalXPRank = globalXPData?.rank ?? null;
  const globalStreakEntries = globalStreakData?.entries || [];
  const globalStreakRank = globalStreakData?.rank ?? null;

  const handleShowGlobalXP = () => {
    // Navigate to stack screen
    const stackNav = navigation.getParent();
    if (stackNav) {
      (stackNav as any).navigate("GlobalLeaderboard", { type: "xp" });
    }
  };

  const handleShowGlobalStreak = () => {
    // Navigate to stack screen
    const stackNav = navigation.getParent();
    if (stackNav) {
      (stackNav as any).navigate("GlobalLeaderboard", { type: "streak" });
    }
  };

  const handleShowPrivate = (leaderboardId: string) => {
    // Navigate to stack screen
    const stackNav = navigation.getParent();
    if (stackNav) {
      (stackNav as any).navigate("PrivateLeaderboard", { leaderboardId });
    }
  };

  const handleManagePrivate = (leaderboardId: string) => {
    // Navigate to stack screen
    const stackNav = navigation.getParent();
    if (stackNav) {
      (stackNav as any).navigate("PrivateLeaderboard", { leaderboardId });
    }
  };

  const handleRowClick = (userId: string) => {
    // Navigate to stack screen
    const stackNav = navigation.getParent();
    if (stackNav) {
      (stackNav as any).navigate("UserProfile", { userId });
    }
  };

  // Require authenticated user with username (not anonymous)
  if (!authProfile?.userId || !authProfile?.username) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.messageTitle}>Sign In Required</Text>
          <Text style={styles.messageText}>
            Please sign in or create an account to view and create leaderboards.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              // Navigate to Profile tab (both are in the same Tab navigator)
              // Cast to any to access tab navigation methods
              const tabNav = navigation as any;
              if (tabNav.jumpTo) {
                tabNav.jumpTo("Profile");
              } else {
                tabNav.navigate("Profile");
              }
            }}
          >
            <Text style={styles.loginButtonText}>Go to Profile →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { marginTop: insets.top + 16 }]}>
        Leaderboards
      </Text>
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {/* Global XP Leaderboard */}
          <GlobalLeaderboardPanel
            type="xp"
            entries={globalXPEntries}
            userRank={globalXPRank}
            currentUserId={authProfile.userId}
            onShowMore={handleShowGlobalXP}
            onRefresh={() => refetchGlobalXP()}
            onEntryPress={handleRowClick}
          />

          {/* Global Streak Leaderboard */}
          <GlobalLeaderboardPanel
            type="streak"
            entries={globalStreakEntries}
            userRank={globalStreakRank}
            currentUserId={authProfile.userId}
            onShowMore={handleShowGlobalStreak}
            onRefresh={() => refetchGlobalStreak()}
            onEntryPress={handleRowClick}
          />

          {/* Private Leaderboards */}
          {privateLeaderboards?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                You're not in any private leaderboards yet
              </Text>
            </View>
          ) : (
            privateLeaderboards?.map(({ leaderboard, entries, userRank }) => (
              <PrivateLeaderboardPanel
                key={leaderboard.id}
                leaderboard={leaderboard}
                entries={entries}
                userRank={userRank}
                currentUserId={authProfile.userId}
                onShowMore={() => handleShowPrivate(leaderboard.id)}
                onManage={
                  leaderboard.ownerId === authProfile.userId
                    ? () => handleManagePrivate(leaderboard.id)
                    : undefined
                }
                onRefresh={() => refetchPrivateLeaderboards()}
                onEntryPress={handleRowClick}
                isOwner={leaderboard.ownerId === authProfile.userId}
              />
            ))
          )}

          {/* Create Leaderboard Button - Always visible for logged-in users */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ Create Leaderboard</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <CreateLeaderboardModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(leaderboardId) => {
          // Invalidate private leaderboards query to refresh the list
          queryClient.invalidateQueries({ queryKey: ["privateLeaderboards"] });
          // Navigate directly to the leaderboard detail page
          const stackNav = navigation.getParent();
          if (stackNav) {
            (stackNav as any).navigate("PrivateLeaderboard", { leaderboardId });
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
    paddingHorizontal: 16,
    marginTop: 16,
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
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  loginButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
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
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});
