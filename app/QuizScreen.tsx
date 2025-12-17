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
import { getRandomQuestion, SAMPLE_QUESTIONS } from "../services/questions";
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
  };

  const loadNewQuestion = async () => {
    const correctlyAnsweredIds = gamificationService.getAnsweredQuestionIds();
    const unansweredQuestions = SAMPLE_QUESTIONS.filter(
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

    const result = await gamificationService.recordPractice(
      isCorrect,
      question.id
    );
    setXpGained(result.xpGained);
    setNewAchievements(result.newAchievements);

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

  const handleNext = async () => {
    await loadNewQuestion();
  };

  const handleFinish = () => {
    navigation.goBack();
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
    const unansweredQuestions = SAMPLE_QUESTIONS.filter(
      (q) => !gamificationService.hasAnsweredQuestion(q.id)
    );

    if (unansweredQuestions.length === 0) {
      return (
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleFinish}>
                <Text style={styles.backButton}>← Back</Text>
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
                <Text style={styles.xpIcon}>⭐</Text>
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
              <Text style={styles.completionEmoji}>🎉</Text>
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
      <View style={styles.container}>
        <Text>Loading question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.backButton}>← Back</Text>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 82 },
        ]}
      >
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
    marginTop: 0,
  },
  content: {
    paddingBottom: 32,
    paddingTop: 0,
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
    fontWeight: "bold",
    color: "#2C3E50",
  },
  headerRight: {
    width: 100,
    flexShrink: 0,
    alignItems: "flex-end",
  },
  backButton: {
    fontSize: 16,
    color: "#4ECDC4",
    fontWeight: "600",
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
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  completionCard: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    margin: 16,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 12,
  },
  completionMessage: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
  },
});
