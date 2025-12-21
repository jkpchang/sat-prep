import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressCard } from "../components/ProgressCard";
import { AchievementBadge } from "../components/AchievementBadge";
import { CustomAlert, AlertButton } from "../components/CustomAlert";
import { gamificationService } from "../services/gamification";
import { storageService } from "../services/storage";
import { UserProgress, Achievement } from "../types";
import { typography } from "../styles/typography";

import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type TabParamList = {
  Home: undefined;
  Progress: undefined;
};

type ProgressScreenNavigationProp = BottomTabNavigationProp<
  TabParamList,
  "Progress"
>;

interface ProgressScreenProps {
  navigation: ProgressScreenNavigationProp;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: AlertButton[];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await gamificationService.initialize();
    const currentProgress = gamificationService.getProgress();
    const allAchievements = gamificationService.getAchievements();
    setProgress(currentProgress);
    setAchievements(allAchievements);
  };

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[]
  ) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    setAlertConfig(null);
  };

  const handleClearHistory = () => {
    showAlert(
      "Clear History",
      "Are you sure you want to clear all your progress? This will reset your XP, streaks, answered questions, and achievements. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            hideAlert();
          },
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            hideAlert();
            await performClear();
          },
        },
      ]
    );
  };

  const performClear = async () => {
    try {
      await storageService.clearAll();
      gamificationService.reset();
      await gamificationService.initialize();

      setProgress(null);
      setAchievements([]);

      await loadData();

      showAlert("Success", "All progress has been cleared.", [
        {
          text: "OK",
          onPress: () => hideAlert(),
        },
      ]);
    } catch (error) {
      console.error("Error clearing history:", error);
      showAlert("Error", "Failed to clear history. Please try again.", [
        {
          text: "OK",
          onPress: () => hideAlert(),
        },
      ]);
    }
  };

  // Reload when screen comes into focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  if (!progress) {
    return (
      <View style={styles.container}>
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>&lt; Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.progressGrid}>
          <View style={styles.gridRow}>
            <ProgressCard label="Total XP" value={progress.totalXP} icon="⭐" />
            <ProgressCard
              label="Questions"
              value={progress.questionsAnswered}
              icon="❓"
            />
            <ProgressCard
              label="Correct"
              value={progress.correctAnswers}
              icon="✅"
            />
          </View>
          <View style={styles.gridRow}>
            <ProgressCard label="Accuracy" value={`${accuracy}%`} icon="🎯" />
            <ProgressCard
              label="Day Streak"
              value={progress.dayStreak}
              icon="🔥"
            />
            <ProgressCard
              label="Answer Streak"
              value={progress.answerStreak}
              icon="⚡"
            />
          </View>
        </View>
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </View>

      <View style={styles.clearHistorySection}>
        <TouchableOpacity
          style={styles.clearHistoryButton}
          onPress={handleClearHistory}
          activeOpacity={0.7}
        >
          <Text style={styles.clearHistoryText}>Clear History</Text>
        </TouchableOpacity>
      </View>

      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8ECF0", // Changed from "#F5F7FA" to a darker gray
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
  statsSection: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
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
  clearHistorySection: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  clearHistoryButton: {
    backgroundColor: "#E74C3C",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearHistoryText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
  },
});
