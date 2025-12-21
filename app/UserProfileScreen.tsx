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

      // Use public_profile_data view for public profile access (bypasses RLS restrictions)
      // This view only exposes public data (no email)
      const { data: profile, error } = await supabase
        .from("public_profile_data")
        .select("user_id, username, total_xp, day_streak, questions_answered, correct_answers, answer_streak, last_question_date, questions_answered_today, last_valid_streak_date, achievements, answered_question_ids")
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
      
      // Reconstruct UserProgress from columns
      const reconstructedStats: UserProgress = {
        totalXP: profile.total_xp || 0,
        dayStreak: profile.day_streak || 0,
        questionsAnswered: profile.questions_answered || 0,
        correctAnswers: profile.correct_answers || 0,
        answerStreak: profile.answer_streak || 0,
        lastQuestionDate: profile.last_question_date || null,
        questionsAnsweredToday: profile.questions_answered_today || 0,
        lastValidStreakDate: profile.last_valid_streak_date || null,
        achievements: profile.achievements || [],
        answeredQuestionIds: profile.answered_question_ids || [],
      };
      setStats(reconstructedStats);

      // Load only unlocked achievements
      const allAchievements = gamificationService.getAchievements();
      const userAchievementIds = profile.achievements || [];
      const unlockedAchievements = allAchievements
        .filter((ach) => userAchievementIds.includes(ach.id))
        .map((ach) => ({
          ...ach,
          unlocked: true,
        }));
      setAchievements(unlockedAchievements);
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
          <Text style={styles.headerTitle}>{username || "Profile"}</Text>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{username || "Profile"}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.progressGrid}>
          <View style={styles.gridRow}>
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
          </View>
          <View style={styles.gridRow}>
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
          </View>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.length > 0 ? (
          achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))
        ) : (
          <Text style={styles.noAchievementsText}>
            No achievements yet - what a noob
          </Text>
        )}
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
    marginHorizontal: -4,
  },
  gridRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  achievementsSection: {
    marginTop: 24,
    padding: 16,
  },
  noAchievementsText: {
    fontSize: 16,
    color: "#7F8C8D",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 24,
  },
});

