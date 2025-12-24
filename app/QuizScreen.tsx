import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionCard } from "../components/QuestionCard";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import {
  getRandomQuestion,
  getFilteredSampleQuestions,
} from "../services/questions";
import { gamificationService } from "../services/gamification";
import { Question, Achievement } from "../types";
import { StreakCelebrationModal } from "../components/StreakCelebrationModal";
import { AchievementCelebrationModal } from "../components/AchievementCelebrationModal";
import { AppIcon } from "../components/AppIcon";
import {
  triggerSuccessFeedback,
  initializeFeedbackSound,
} from "../utils/feedbackUtils";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabParamList = {
  Home: undefined;
  Progress: undefined;
};

type RootStackParamList = {
  Main: TabParamList;
  Quiz: undefined;
};

type QuizScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Quiz"
>;

interface QuizScreenProps {
  navigation: QuizScreenNavigationProp;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [showStars, setShowStars] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [dayStreak, setDayStreak] = useState(0);
  const [currentAchievement, setCurrentAchievement] =
    useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  const buttonRef = useRef<View>(null);
  const xpBadgeRef = useRef<View>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [xpBadgePosition, setXpBadgePosition] = useState({ x: 0, y: 0 });

  const xpScaleAnim = useRef(new Animated.Value(1)).current;
  const xpGainAnim = useRef(new Animated.Value(0)).current;
  const xpGainOpacity = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  const starAnimations = useRef(
    Array.from({ length: 5 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Initialize feedback sound system
    initializeFeedbackSound();

    gamificationService.initialize().then(() => {
      loadNewQuestion();
      loadXP();
    });
  }, []);

  useEffect(() => {
    if (totalXP > 0) {
      xpGainAnim.setValue(totalXP);
    }
  }, []);

  const loadXP = async () => {
    await gamificationService.initialize();
    const progress = gamificationService.getProgress();
    setTotalXP(progress.totalXP);
    setDayStreak(progress.dayStreak);
  };

  const loadNewQuestion = async () => {
    const correctlyAnsweredIds = gamificationService.getAnsweredQuestionIds();
    const filteredQuestions = getFilteredSampleQuestions();
    const unansweredQuestions = filteredQuestions.filter(
      (q) => !gamificationService.hasAnsweredQuestion(q.id)
    );

    if (unansweredQuestions.length === 0) {
      setQuestion(null);
      setSelectedAnswer(null);
      setShowResult(false);
      setXpGained(0);
      setShowStars(false);
      await loadXP();
      return;
    }

    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const newQuestion = unansweredQuestions[randomIndex];
    setQuestion(newQuestion);

    setSelectedAnswer(null);
    setShowResult(false);
    setXpGained(0);
    setShowStars(false);
    starAnimations.forEach((star) => {
      star.translateX.setValue(0);
      star.translateY.setValue(0);
      star.scale.setValue(1);
      star.opacity.setValue(0);
      star.rotation.setValue(0);
    });
    await loadXP();
  };

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
  };

  const animateStars = () => {
    if (buttonPosition.x === 0 || xpBadgePosition.x === 0) return;

    const startX = buttonPosition.x + SCREEN_WIDTH / 2 - 16;
    const startY = buttonPosition.y;
    const endX = xpBadgePosition.x;
    const endY = xpBadgePosition.y + 15;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const animations = starAnimations.map((star, index) => {
      const randomOffset = (index - 2) * 30;
      const curveOffset =
        Math.sin((index / starAnimations.length) * Math.PI) * 50;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(star.translateX, {
              toValue: deltaX + randomOffset,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(star.translateY, {
              toValue: deltaY + curveOffset,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(star.scale, {
                toValue: 1.5,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(star.scale, {
                toValue: 0.5,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(star.rotation, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(star.opacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      starAnimations.forEach((star) => {
        star.translateX.setValue(0);
        star.translateY.setValue(0);
        star.scale.setValue(1);
        star.opacity.setValue(0);
        star.rotation.setValue(0);
      });
      setShowStars(false);
    });
  };

  const animateXPGain = (newXP: number, isCorrect: boolean) => {
    const currentXP = totalXP;
    xpGainAnim.setValue(currentXP);
    isAnimatingRef.current = true;

    if (isCorrect) {
      setShowStars(true);
      setTimeout(() => {
        animateStars();
      }, 100);
    }

    Animated.sequence([
      Animated.parallel([
        Animated.spring(xpScaleAnim, {
          toValue: 1.3,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(xpGainAnim, {
          toValue: newXP,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      Animated.spring(xpScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimatingRef.current = false;
    });

    xpGainOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(xpGainOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(xpGainOpacity, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || !question) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    setShowResult(true);

    // Trigger haptic and sound feedback when answer is correct
    if (isCorrect) {
      triggerSuccessFeedback();
    }

    const result = await gamificationService.recordPractice(
      isCorrect,
      question.id
    );
    setXpGained(result.xpGained);
    setNewAchievements(result.newAchievements);

    const newTotalXP = totalXP + result.xpGained;
    setTotalXP(newTotalXP);
    animateXPGain(newTotalXP, isCorrect);

    // Update day streak if it changed
    if (result.streakExtended) {
      setDayStreak(result.newDayStreak);
    }

    // Queue achievements and streak celebration together
    if (result.streakExtended || result.newAchievements.length > 0) {
      setTimeout(() => {
        // Show streak celebration first if it exists, then achievements
        if (result.streakExtended) {
          // Queue achievements to show after streak modal closes
          if (result.newAchievements.length > 0) {
            setAchievementQueue(result.newAchievements);
          }
          setShowStreakCelebration(true);
        } else {
          // No streak, show achievements directly
          if (result.newAchievements.length > 0) {
            setAchievementQueue(result.newAchievements);
            showNextAchievement(result.newAchievements);
          }
        }
      }, 800);
    }
  };

  const handleNext = async () => {
    await loadNewQuestion();
  };

  const handleFinish = () => {
    navigation.goBack();
  };

  const handleCollectStreakXP = async () => {
    // Trigger haptic and sound feedback when collecting 5 XP
    triggerSuccessFeedback();

    const result = await gamificationService.addBonusXP(5);
    const newTotalXP = totalXP + result.xpGained;
    setTotalXP(newTotalXP);
    setXpGained(result.xpGained);
    // Animate XP gain with the existing animation
    animateXPGain(newTotalXP, true); // true for isCorrect to show stars

    // Close streak modal
    setShowStreakCelebration(false);

    // Queue any new achievements to show after XP animation
    setAchievementQueue((prev) => {
      const updatedQueue = [...prev, ...result.newAchievements];

      // Wait for XP animation to complete before showing next achievement
      setTimeout(() => {
        if (updatedQueue.length > 0) {
          showNextAchievement(updatedQueue);
        }
      }, 1000);

      return updatedQueue;
    });
  };

  const showNextAchievement = (achievements: Achievement[]) => {
    if (achievements.length > 0) {
      setCurrentAchievement(achievements[0]);
      setAchievementQueue(achievements.slice(1));
    }
  };

  const handleAchievementClose = () => {
    setCurrentAchievement(null);
    // If user closes without collecting, still show next achievement after a delay
    // This handles the case where user closes modal without collecting XP
    setAchievementQueue((prev) => {
      if (prev.length > 0) {
        setTimeout(() => {
          showNextAchievement(prev);
        }, 500);
      }
      return prev;
    });
  };

  const handleCollectAchievementXP = async (achievement: Achievement) => {
    // Trigger haptic and sound feedback when collecting XP
    triggerSuccessFeedback();

    // Award the XP for this achievement
    const result = await gamificationService.collectAchievementXP(
      achievement.id
    );
    const newTotalXP = totalXP + result.xpGained;
    setTotalXP(newTotalXP);
    setXpGained(result.xpGained);

    // Animate XP gain (animation takes ~800ms total)
    animateXPGain(newTotalXP, true);

    // Get current queue and add any new achievements
    setAchievementQueue((prev) => {
      const updatedQueue = [...prev, ...result.newAchievements];

      // Wait for XP animation to complete before showing next achievement
      // XP animation: 600ms odometer + 200ms popup fade in + 800ms popup fade out + 300ms delay = ~1900ms total
      // We'll wait 1000ms to let the main animation play, then show next achievement
      setTimeout(() => {
        if (updatedQueue.length > 0) {
          showNextAchievement(updatedQueue);
        }
      }, 1000);

      return updatedQueue;
    });
  };

  const AnimatedXPText = () => {
    const [displayXP, setDisplayXP] = useState(totalXP);

    useEffect(() => {
      const listenerId = xpGainAnim.addListener(({ value }) => {
        setDisplayXP(Math.round(value));
      });

      return () => {
        xpGainAnim.removeListener(listenerId);
      };
    }, []);

    useEffect(() => {
      if (!isAnimatingRef.current) {
        xpGainAnim.setValue(totalXP);
        setDisplayXP(totalXP);
      }
    }, [totalXP]);

    return <Text style={styles.xpText}>{displayXP}</Text>;
  };

  if (!question) {
    const filteredQuestions = getFilteredSampleQuestions();
    const unansweredQuestions = filteredQuestions.filter(
      (q) => !gamificationService.hasAnsweredQuestion(q.id)
    );

    if (unansweredQuestions.length === 0) {
      return (
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleFinish}>
                <Text style={styles.backButton}>&lt; Back</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Practice</Text>
            </View>
            <View style={styles.headerRight}>
              <Animated.View
                style={[
                  styles.xpBadge,
                  {
                    transform: [{ scale: xpScaleAnim }],
                  },
                ]}
              >
                <AppIcon name="stat.xp" size={16} tone="xp" />
                <AnimatedXPText />
              </Animated.View>
            </View>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.completionContainer,
              { paddingTop: insets.top + 82 },
            ]}
          >
            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <AppIcon name="ui.celebrate" tone="xp" size={44} />
              </View>
              <Text style={styles.completionTitle}>
                You are a genius! You've answered all our questions correctly!
              </Text>
              <Text style={styles.completionMessage}>
                Upgrade to get our new question pack.
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 16, paddingHorizontal: 16 },
        ]}
      >
        <Text>Loading question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.backButton}>&lt; Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Practice</Text>
        </View>
        <View
          style={styles.headerRight}
          ref={xpBadgeRef}
          onLayout={() => {
            xpBadgeRef.current?.measureInWindow(
              (winX, winY, winWidth, winHeight) => {
                setXpBadgePosition({
                  x: winX + winWidth - 20,
                  y: winY + winHeight / 2,
                });
              }
            );
          }}
        >
          <Animated.View
            style={[
              styles.xpBadge,
              {
                transform: [{ scale: xpScaleAnim }],
              },
            ]}
          >
            <AppIcon name="stat.xp" size={16} tone="xp" />
            <AnimatedXPText />
          </Animated.View>
          {xpGained > 0 && (
            <Animated.View
              style={[
                styles.xpGainPopup,
                {
                  opacity: xpGainOpacity,
                  transform: [
                    {
                      translateY: xpGainOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.xpGainText}>+{xpGained} XP</Text>
            </Animated.View>
          )}
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 82,
            paddingBottom: 120, // Extra padding to ensure explanation is visible above button panel
          },
        ]}
      >
        <QuestionCard
          question={question}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleSelectAnswer}
          showResult={showResult}
        />
      </ScrollView>

      <View
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}
      >
        {!showResult ? (
          <View
            ref={buttonRef}
            onLayout={() => {
              buttonRef.current?.measureInWindow(
                (winX, winY, winWidth, winHeight) => {
                  setButtonPosition({
                    x: winX + winWidth / 2,
                    y: winY + winHeight / 2,
                  });
                }
              );
            }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                selectedAnswer === null && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={selectedAnswer === null}
            >
              <Text style={styles.buttonText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleNext}>
              <Text style={styles.buttonText}>Next Question</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showStars &&
        starAnimations.map((star, index) => {
          const spin = star.rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.star,
                {
                  opacity: star.opacity,
                  transform: [
                    { translateX: star.translateX },
                    { translateY: star.translateY },
                    { scale: star.scale },
                    { rotate: spin },
                  ],
                  left: buttonPosition.x || SCREEN_WIDTH / 2,
                  top: buttonPosition.y || 0,
                },
              ]}
              pointerEvents="none"
            >
              <AppIcon name="stat.xp" tone="xp" size={24} />
            </Animated.View>
          );
        })}

      <StreakCelebrationModal
        visible={showStreakCelebration}
        dayStreak={dayStreak}
        onClose={() => {
          setShowStreakCelebration(false);
          // After streak modal closes, show achievements if any are queued
          setAchievementQueue((prev) => {
            if (prev.length > 0) {
              setTimeout(() => {
                showNextAchievement(prev);
              }, 500);
            }
            return prev;
          });
        }}
        onCollectXP={handleCollectStreakXP}
      />

      {currentAchievement && (
        <AchievementCelebrationModal
          visible={!!currentAchievement}
          achievement={currentAchievement}
          onClose={handleAchievementClose}
          onCollectXP={
            currentAchievement.xpReward && currentAchievement.xpReward > 0
              ? () => handleCollectAchievementXP(currentAchievement)
              : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    marginTop: 0,
  },
  content: {
    paddingTop: 0,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  star: {
    position: "absolute",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  starEmoji: {
    fontSize: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerLeft: {
    width: 100,
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  headerRight: {
    width: 100,
    flexShrink: 0,
    alignItems: "flex-end",
  },
  backButton: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  xpIcon: {
    fontSize: 16,
  },
  xpText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.onPrimary,
    minWidth: 30,
    textAlign: "right",
  },
  xpGainPopup: {
    position: "absolute",
    top: -30,
    right: 0,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  xpGainText: {
    color: theme.colors.onSuccess,
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    minHeight: 56,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    minHeight: 56,
  },
  buttonSecondaryText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  completionCard: {
    backgroundColor: theme.colors.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    margin: 16,
  },
  completionIcon: {
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  completionMessage: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
