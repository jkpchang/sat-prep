import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { typography } from "../styles/typography";
import { theme } from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FLAME_COUNT = 20;

interface StreakCelebrationModalProps {
  visible: boolean;
  dayStreak: number;
  onClose: () => void;
  onCollectXP?: () => Promise<void>;
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
  const [isCollecting, setIsCollecting] = useState(false);
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
      // Reset state when modal becomes visible
      setIsCollecting(false);
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
                style={[
                  styles.collectButton,
                  isCollecting && styles.collectButtonDisabled,
                ]}
                onPress={async () => {
                  if (isCollecting) return;
                  setIsCollecting(true);
                  // Call onCollectXP - parent will handle closing the modal and XP animation
                  await onCollectXP();
                  // Close modal after XP collection is handled
                  onClose();
                }}
                disabled={isCollecting}
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
    backgroundColor: theme.colors.overlayStrong,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    shadowColor: theme.shadow.color,
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
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    marginBottom: 24,
    textAlign: "center",
  },
  streakContainer: {
    backgroundColor: theme.colors.warningBg,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.colors.warning,
    minWidth: 150,
    alignItems: "center",
  },
  streakNumber: {
    fontSize: 48,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.warningText,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.warningText,
  },
  message: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  collectButton: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.warningText,
    minWidth: 180,
  },
  collectButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabledBorder,
    opacity: 0.6,
  },
  collectButtonText: {
    color: theme.colors.onWarning,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    textAlign: "center",
  },
});

