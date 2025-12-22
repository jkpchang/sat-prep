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
import { Achievement } from "../types";
import { theme } from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONFETTI_COUNT = 25;

interface AchievementCelebrationModalProps {
  visible: boolean;
  achievement: Achievement;
  onClose: () => void;
  onCollectXP?: () => Promise<void>;
}

interface Confetti {
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

export const AchievementCelebrationModal: React.FC<
  AchievementCelebrationModalProps
> = ({ visible, achievement, onClose, onCollectXP }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnimations = useRef<Confetti[]>(
    Array.from({ length: CONFETTI_COUNT }, () => ({
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
      confettiAnimations.forEach((confetti) => {
        confetti.translateX.setValue(0);
        confetti.translateY.setValue(0);
        confetti.scale.setValue(1);
        confetti.opacity.setValue(0);
        confetti.rotation.setValue(0);
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

      // Animate confetti
      setTimeout(() => {
        animateConfetti();
      }, 200);
    }
  }, [visible]);

  const animateConfetti = () => {
    const animations = confettiAnimations.map((confetti, index) => {
      // Random starting position around the center
      const angle = (index / CONFETTI_COUNT) * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      const startX = Math.cos(angle) * radius;
      const startY = Math.sin(angle) * radius;

      // Random end position (spread outward)
      const endRadius = 200 + Math.random() * 150;
      const endX = Math.cos(angle) * endRadius;
      const endY = Math.sin(angle) * endRadius;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(confetti.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(confetti.translateX, {
              toValue: endX,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.translateY, {
              toValue: endY,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(confetti.scale, {
                toValue: 1.5,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(confetti.scale, {
                toValue: 0.3,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(confetti.rotation, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(confetti.opacity, {
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

  const xpReward = achievement.xpReward || 0;

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
        {/* Animated confetti */}
        {confettiAnimations.map((confetti, index) => {
          const spin = confetti.rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  opacity: confetti.opacity,
                  transform: [
                    { translateX: confetti.translateX },
                    { translateY: confetti.translateY },
                    { scale: confetti.scale },
                    { rotate: spin },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.confettiEmoji}>🎉</Text>
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
          <View style={styles.iconContainer}>
            <Text style={styles.bigIcon}>{achievement.icon}</Text>
          </View>

          <Text style={styles.title}>Achievement Unlocked!</Text>
          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          {xpReward > 0 && (
            <View style={styles.xpContainer}>
              <Text style={styles.xpNumber}>+{xpReward}</Text>
              <Text style={styles.xpLabel}>XP Reward</Text>
            </View>
          )}

          {onCollectXP && xpReward > 0 && (
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
                Collect {xpReward} XP
              </Text>
            </TouchableOpacity>
          )}

          {(!onCollectXP || xpReward === 0) && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Awesome!</Text>
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
  confetti: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    top: SCREEN_HEIGHT / 2,
    left: SCREEN_WIDTH / 2,
  },
  confettiEmoji: {
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
  iconContainer: {
    marginBottom: 16,
  },
  bigIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  achievementName: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  xpContainer: {
    backgroundColor: theme.colors.infoBgAlt,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    minWidth: 150,
    alignItems: "center",
  },
  xpNumber: {
    fontSize: 48,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  xpLabel: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  collectButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primaryPressed,
    minWidth: 180,
  },
  collectButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabledBorder,
    opacity: 0.6,
  },
  collectButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primaryPressed,
    minWidth: 180,
  },
  closeButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    textAlign: "center",
  },
});
