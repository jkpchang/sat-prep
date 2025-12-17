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
import { StreakDisplay } from "../components/StreakDisplay";
import { ProgressCard } from "../components/ProgressCard";
import { gamificationService } from "../services/gamification";
import { UserProgress } from "../types";

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
      <View style={[styles.header, { marginTop: insets.top + 24 }]}>
        <Text style={styles.title}>Testez!</Text>
        <Text style={styles.subtitle}>Level up your skills!</Text>
      </View>

      <StreakDisplay streak={progress.streak} />

      <View style={styles.dailyChallenge}>
        <Text style={styles.challengeTitle}>📚 Daily Challenge</Text>
        <Text style={styles.challengeDescription}>
          Complete 5 questions today to maintain your streak!
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartPractice}
        >
          <Text style={styles.startButtonText}>Start Practice</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressGrid}>
          <ProgressCard label="Total XP" value={progress.totalXP} icon="⭐" />
          <ProgressCard
            label="Questions"
            value={progress.questionsAnswered}
            icon="❓"
          />
          <ProgressCard label="Accuracy" value={`${accuracy}%`} icon="🎯" />
        </View>
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Progress")}
      >
        <Text style={styles.secondaryButtonText}>View Full Progress →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
  },
  dailyChallenge: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: "#4ECDC4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
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
    color: "#4ECDC4",
    fontSize: 16,
    fontWeight: "600",
  },
});
