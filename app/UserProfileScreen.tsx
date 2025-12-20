import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../services/supabaseClient";
import { gamificationService } from "../services/gamification";
import { Achievement, UserProgress } from "../types";
import { ProgressCard } from "../components/ProgressCard";
import { AchievementBadge } from "../components/AchievementBadge";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Main: undefined;
  Quiz: undefined;
  Leaderboard: undefined;
  GlobalLeaderboard: { type: "xp" | "streak" };
  PrivateLeaderboard: { leaderboardId: string };
  UserProfile: { userId: string };
};

type UserProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UserProfile"
>;

interface UserProfileScreenProps {
  navigation: UserProfileScreenNavigationProp;
  route: { params: { userId: string } };
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [stats, setStats] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, stats")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      if (!profile) {
        return;
      }

      setUsername(profile.username);
      setStats(profile.stats as UserProgress);

      // Load achievements
      const allAchievements = gamificationService.getAchievements();
      const userAchievementIds = (profile.stats as any)?.achievements || [];
      const userAchievements = allAchievements.map((ach) => ({
        ...ach,
        unlocked: userAchievementIds.includes(ach.id),
      }));
      setAchievements(userAchievements);
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>Profile not found</Text>
        </View>
      </View>
    );
  }

  const accuracy =
    stats.questionsAnswered > 0
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
      : 0;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.username}>{username || "Unknown User"}</Text>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.progressGrid}>
          <ProgressCard label="Total XP" value={stats.totalXP} icon="⭐" />
          <ProgressCard
            label="Questions"
            value={stats.questionsAnswered}
            icon="❓"
          />
          <ProgressCard
            label="Correct"
            value={stats.correctAnswers}
            icon="✅"
          />
          <ProgressCard label="Accuracy" value={`${accuracy}%`} icon="🎯" />
          <ProgressCard
            label="Day Streak"
            value={stats.dayStreak}
            icon="🔥"
          />
          <ProgressCard
            label="Answer Streak"
            value={stats.answerStreak}
            icon="⚡"
          />
          <ProgressCard
            label="Achievements"
            value={`${unlockedCount}/${achievements.length}`}
            icon="🏆"
          />
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8ECF0",
  },
  content: {
    paddingBottom: 32,
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
    color: "#4ECDC4",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  placeholder: {
    width: 60,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  profileSection: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  statsSection: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 16,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementsSection: {
    marginTop: 24,
    padding: 16,
  },
});

