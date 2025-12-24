import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DayStreakDisplay } from "../components/DayStreakDisplay";
import { ProgressCard } from "../components/ProgressCard";
import { ThemedButton } from "../components/ThemedButton";
import { gamificationService } from "../services/gamification";
import { UserProgress } from "../types";
import { typography } from "../styles/typography";
import { theme } from "../theme";

import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type TabParamList = {
  Home: undefined;
  Progress: undefined;
};

type RootStackParamList = {
  Main: TabParamList;
  Quiz: undefined;
  GlobalLeaderboard: { type: "xp" | "streak" };
  PrivateLeaderboard: { leaderboardId: string };
  UserProfile: { userId: string };
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  const loadProgress = async () => {
    await gamificationService.initialize();
    const currentProgress = gamificationService.getProgress();
    setProgress(currentProgress);
  };

  useEffect(() => {
    loadProgress();
  }, []);

  // Reload when screen comes into focus (e.g., returning from Quiz screen)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadProgress();
    });
    return unsubscribe;
  }, [navigation]);

  const handleStartPractice = () => {
    navigation.navigate("Quiz");
  };

  if (!progress) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 16, paddingHorizontal: 16 },
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  const accuracy =
    progress.questionsAnswered > 0
      ? Math.round((progress.correctAnswers / progress.questionsAnswered) * 100)
      : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { marginTop: insets.top + 24 }]}>
        <Text style={styles.title}>SatUP!</Text>
        <Text style={styles.subtitle}>Level up your skills!</Text>
      </View>

      <DayStreakDisplay
        dayStreak={progress.dayStreak}
        questionsAnsweredToday={progress.questionsAnsweredToday}
      />

      <View style={styles.dailyChallenge}>
        <Text style={styles.challengeTitle}>📚 Daily Challenge</Text>
        <Text style={styles.challengeDescription}>
          {progress.questionsAnsweredToday >= 5
            ? "Daily goal completed! 🎉 But you can still keep practicing..."
            : "Complete 5 questions today to maintain your streak!"}
        </Text>
        <ThemedButton
          title="Start Practice"
          onPress={handleStartPractice}
          size="lg"
        />
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressGrid}>
          <ProgressCard
            label="Total XP"
            value={progress.totalXP}
            iconName="stat.xp"
            iconTone="xp"
          />
          <ProgressCard
            label="Questions"
            value={progress.questionsAnswered}
            iconName="stat.questions"
            iconTone="questions"
          />
          <ProgressCard
            label="Accuracy"
            value={`${accuracy}%`}
            iconName="stat.accuracy"
            iconTone="accuracy"
          />
        </View>
      </View>

      <ThemedButton
        title="View Full Progress →"
        onPress={() => navigation.navigate("Progress")}
        variant="ghost"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
  },
  dailyChallenge: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    marginVertical: 16,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  progressSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  secondaryButton: {
    marginTop: 24,
    padding: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});
