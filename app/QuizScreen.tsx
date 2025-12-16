import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionCard } from "../components/QuestionCard";
import { getRandomQuestion } from "../services/questions";
import { gamificationService } from "../services/gamification";
import { Question, Achievement } from "../types";

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

  // Position refs for star animation
  const buttonRef = useRef<View>(null);
  const xpBadgeRef = useRef<View>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [xpBadgePosition, setXpBadgePosition] = useState({ x: 0, y: 0 });

  // Animation values
  const xpScaleAnim = useRef(new Animated.Value(1)).current;
  const xpGainAnim = useRef(new Animated.Value(0)).current;
  const xpGainOpacity = useRef(new Animated.Value(0)).current;

  // Star animations (create 5 stars)
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
    loadNewQuestion();
    loadXP();
  }, []);

  // Initialize animation value
  useEffect(() => {
    xpGainAnim.setValue(totalXP);
  }, [totalXP]);

  const loadXP = async () => {
    await gamificationService.initialize();
    const progress = gamificationService.getProgress();
    setTotalXP(progress.totalXP);
  };

  const loadNewQuestion = async () => {
    const newQuestion = getRandomQuestion();
    setQuestion(newQuestion);
    setSelectedAnswer(null);
    setShowResult(false);
    setXpGained(0);
    setShowStars(false);
    // Reset star animations
    starAnimations.forEach((star) => {
      star.translateX.setValue(0);
      star.translateY.setValue(0);
      star.scale.setValue(1);
      star.opacity.setValue(0);
      star.rotation.setValue(0);
    });
    // Reload XP to ensure it's up to date
    await loadXP();
  };

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
  };

  const animateStars = () => {
    if (buttonPosition.x === 0 || xpBadgePosition.x === 0) return;

    const startX = buttonPosition.x + SCREEN_WIDTH / 2 - 16; // Button center
    const startY = buttonPosition.y;
    const endX = xpBadgePosition.x;
    const endY = xpBadgePosition.y + 15; // XP badge center

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Animate each star with slight variations
    const animations = starAnimations.map((star, index) => {
      // Add some randomness to the path
      const randomOffset = (index - 2) * 30; // Spread stars horizontally
      const curveOffset =
        Math.sin((index / starAnimations.length) * Math.PI) * 50;

      return Animated.parallel([
        // Movement animation
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

    // Start all star animations
    Animated.parallel(animations).start(() => {
      // Reset after animation completes
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
    // Set starting value for animation
    xpGainAnim.setValue(totalXP);

    // Animate stars if correct
    if (isCorrect) {
      setShowStars(true);
      setTimeout(() => {
        animateStars();
      }, 100);
    }

    // Bounce animation for XP display
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
    ]).start();

    // Show "+XP" popup animation
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

    const result = await gamificationService.recordPractice(isCorrect);
    setXpGained(result.xpGained);
    setNewAchievements(result.newAchievements);

    // Update total XP and animate
    const newTotalXP = totalXP + result.xpGained;
    setTotalXP(newTotalXP);
    animateXPGain(newTotalXP, isCorrect);

    if (result.newAchievements.length > 0) {
      setTimeout(() => {
        Alert.alert(
          "🎉 Achievement Unlocked!",
          result.newAchievements.map((a) => `${a.icon} ${a.name}`).join("\n"),
          [{ text: "Awesome!" }]
        );
      }, 500);
    }
  };

  const handleNext = () => {
    loadNewQuestion();
  };

  const handleFinish = () => {
    navigation.goBack();
  };

  // Animated XP text component
  const AnimatedXPText = () => {
    const [displayXP, setDisplayXP] = useState(totalXP);

    useEffect(() => {
      setDisplayXP(totalXP);
    }, [totalXP]);

    useEffect(() => {
      const listenerId = xpGainAnim.addListener(({ value }) => {
        setDisplayXP(Math.round(value));
      });
      return () => {
        xpGainAnim.removeListener(listenerId);
      };
    }, []);

    return <Text style={styles.xpText}>{displayXP}</Text>;
  };

  if (!question) {
    return (
      <View style={styles.container}>
        <Text>Loading question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Practice</Text>
          <View
            style={styles.xpContainer}
            ref={xpBadgeRef}
            onLayout={() => {
              xpBadgeRef.current?.measureInWindow(
                (winX, winY, winWidth, winHeight) => {
                  setXpBadgePosition({
                    x: winX + winWidth - 20, // Right edge of badge
                    y: winY + winHeight / 2, // Center of badge
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
              <Text style={styles.xpIcon}>⭐</Text>
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

        {xpGained > 0 && (
          <View style={styles.xpBanner}>
            <Text style={styles.xpBannerText}>+{xpGained} XP earned!</Text>
          </View>
        )}

        <QuestionCard
          question={question}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleSelectAnswer}
          showResult={showResult}
        />

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
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleFinish}
            >
              <Text style={styles.buttonSecondaryText}>Finish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleNext}>
              <Text style={styles.buttonText}>Next Question</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Animated Stars */}
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
              <Text style={styles.starEmoji}>⭐</Text>
            </Animated.View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
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
  xpContainer: {
    position: "relative",
    alignItems: "flex-end",
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4ECDC4",
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
    fontWeight: "bold",
    color: "#FFFFFF",
    minWidth: 30,
    textAlign: "right",
  },
  xpGainPopup: {
    position: "absolute",
    top: -30,
    right: 0,
    backgroundColor: "#2ECC71",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  xpGainText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  xpBanner: {
    backgroundColor: "#4ECDC4",
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  xpBannerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#4ECDC4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#BDC3C7",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ECDC4",
    minHeight: 56,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: "#4ECDC4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    minHeight: 56,
  },
  buttonSecondaryText: {
    color: "#4ECDC4",
    fontSize: 18,
    fontWeight: "bold",
  },
});
