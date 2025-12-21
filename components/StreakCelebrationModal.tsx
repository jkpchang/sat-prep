import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FLAME_COUNT = 20;

interface StreakCelebrationModalProps {
  visible: boolean;
  dayStreak: number;
  onClose: () => void;
  onCollectXP?: () => void;
}

interface Flame {
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  visible,
  dayStreak,
  onClose,
  onCollectXP,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const flameAnimations = useRef<Flame[]>(
    Array.from({ length: FLAME_COUNT }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      flameAnimations.forEach((flame) => {
        flame.translateX.setValue(0);
        flame.translateY.setValue(0);
        flame.scale.setValue(1);
        flame.opacity.setValue(0);
        flame.rotation.setValue(0);
      });

      // Animate modal entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate flames
      setTimeout(() => {
        animateFlames();
      }, 200);
    }
  }, [visible]);

  const animateFlames = () => {
    const animations = flameAnimations.map((flame, index) => {
      // Random starting position around the center
      const angle = (index / FLAME_COUNT) * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      const startX = Math.cos(angle) * radius;
      const startY = Math.sin(angle) * radius;

      // Random end position (spread outward)
      const endRadius = 200 + Math.random() * 150;
      const endX = Math.cos(angle) * endRadius;
      const endY = Math.sin(angle) * endRadius;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(flame.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(flame.translateX, {
              toValue: endX,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(flame.translateY, {
              toValue: endY,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(flame.scale, {
                toValue: 1.5,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(flame.scale, {
                toValue: 0.3,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(flame.rotation, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(flame.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Animated flames */}
        {flameAnimations.map((flame, index) => {
          const spin = flame.rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.flame,
                {
                  opacity: flame.opacity,
                  transform: [
                    { translateX: flame.translateX },
                    { translateY: flame.translateY },
                    { scale: flame.scale },
                    { rotate: spin },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.flameEmoji}>🔥</Text>
            </Animated.View>
          );
        })}

        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.fireContainer}>
            <Text style={styles.bigFire}>🔥</Text>
          </View>

          <Text style={styles.title}>Streak Extended!</Text>
          <Text style={styles.subtitle}>
            You've completed your daily goal!
          </Text>

          <View style={styles.streakContainer}>
            <Text style={styles.streakNumber}>{dayStreak}</Text>
            <Text style={styles.streakLabel}>
              {dayStreak === 1 ? "Day Streak" : "Days Streak"}
            </Text>
          </View>

          <Text style={styles.message}>
            Keep the fire burning! Answer 5 questions every day to maintain
            your streak.
          </Text>

          {onCollectXP && (
              <TouchableOpacity
                style={styles.collectButton}
                onPress={() => {
                  onCollectXP();
                  onClose();
                }}
              >
                <Text style={styles.collectButtonText}>
                  Collect 5 XP
                </Text>
              </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  flame: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    top: SCREEN_HEIGHT / 2,
    left: SCREEN_WIDTH / 2,
  },
  flameEmoji: {
    fontSize: 32,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fireContainer: {
    marginBottom: 16,
  },
  bigFire: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#7F8C8D",
    marginBottom: 24,
    textAlign: "center",
  },
  streakContainer: {
    backgroundColor: "#FFF5E6",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#FFA500",
    minWidth: 150,
    alignItems: "center",
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FF6B35",
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  collectButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B35",
    minWidth: 180,
  },
  collectButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

