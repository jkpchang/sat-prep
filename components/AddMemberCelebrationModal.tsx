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
const STAR_COUNT = 15;

interface AddMemberCelebrationModalProps {
  visible: boolean;
  username: string;
  onClose: () => void;
  onCollectXP?: () => void;
}

interface Star {
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

export const AddMemberCelebrationModal: React.FC<AddMemberCelebrationModalProps> = ({
  visible,
  username,
  onClose,
  onCollectXP,
}) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const starAnimations = useRef<Star[]>(
    Array.from({ length: STAR_COUNT }, () => ({
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
      starAnimations.forEach((star) => {
        star.translateX.setValue(0);
        star.translateY.setValue(0);
        star.scale.setValue(1);
        star.opacity.setValue(0);
        star.rotation.setValue(0);
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

      // Animate stars
      setTimeout(() => {
        animateStars();
      }, 200);
    }
  }, [visible]);

  const animateStars = () => {
    const animations = starAnimations.map((star, index) => {
      // Random starting position around the center
      const angle = (index / STAR_COUNT) * Math.PI * 2;
      const radius = 80 + Math.random() * 40;
      const startX = Math.cos(angle) * radius;
      const startY = Math.sin(angle) * radius;

      // Random end position (spread outward)
      const endRadius = 180 + Math.random() * 120;
      const endX = Math.cos(angle) * endRadius;
      const endY = Math.sin(angle) * endRadius;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(star.translateX, {
              toValue: endX,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(star.translateY, {
              toValue: endY,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(star.scale, {
                toValue: 1.5,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(star.scale, {
                toValue: 0.3,
                duration: 1200,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(star.rotation, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(star.opacity, {
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
        {/* Animated stars */}
        {starAnimations.map((star, index) => {
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
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.starEmoji}>⭐</Text>
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
          <View style={styles.starContainer}>
            <Text style={styles.bigStar}>⭐</Text>
          </View>

          <Text style={styles.title}>Member Added!</Text>
          <Text style={styles.subtitle}>
            {username} has been added to the leaderboard
          </Text>

          <View style={styles.xpContainer}>
            <Text style={styles.xpNumber}>10</Text>
            <Text style={styles.xpLabel}>XP Reward</Text>
          </View>

          <Text style={styles.message}>
            Keep building your community! Add more members to grow together.
          </Text>

          {onCollectXP && (
            <TouchableOpacity
              style={[
                styles.collectButton,
                isCollecting && styles.collectButtonDisabled,
              ]}
              onPress={() => {
                if (isCollecting) return;
                setIsCollecting(true);
                onCollectXP();
                onClose();
              }}
              disabled={isCollecting}
            >
              <Text style={styles.collectButtonText}>
                Collect 10 XP
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
  star: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    top: SCREEN_HEIGHT / 2,
    left: SCREEN_WIDTH / 2,
  },
  starEmoji: {
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
  starContainer: {
    marginBottom: 16,
  },
  bigStar: {
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
  message: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
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
});

