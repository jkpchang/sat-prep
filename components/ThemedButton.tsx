import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { theme } from "../theme";
import { typography } from "../styles/typography";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function ThemedButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const isDisabled = disabled || loading;
  const v = variantStyles(variant);
  const s = sizeStyles(size);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        s.container,
        v.container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.spinnerColor} />
      ) : (
        <Text style={[styles.textBase, s.text, v.text, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

function sizeStyles(size: Size) {
  switch (size) {
    case "sm":
      return {
        container: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
        text: { fontSize: 14 },
      } as const;
    case "lg":
      return {
        container: { paddingVertical: 16, paddingHorizontal: 18, borderRadius: 14 },
        text: { fontSize: 18 },
      } as const;
    case "md":
    default:
      return {
        container: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
        text: { fontSize: 16 },
      } as const;
  }
}

function variantStyles(variant: Variant) {
  switch (variant) {
    case "secondary":
      return {
        container: { backgroundColor: theme.colors.secondary, borderWidth: 0 },
        text: { color: theme.colors.onSecondary },
        spinnerColor: theme.colors.onSecondary,
      } as const;
    case "outline":
      return {
        container: {
          backgroundColor: theme.colors.surface,
          borderWidth: 2,
          borderColor: theme.colors.primary,
        },
        text: { color: theme.colors.primary },
        spinnerColor: theme.colors.primary,
      } as const;
    case "ghost":
      return {
        container: { backgroundColor: "transparent", borderWidth: 0 },
        text: { color: theme.colors.primary },
        spinnerColor: theme.colors.primary,
      } as const;
    case "danger":
      return {
        container: { backgroundColor: theme.colors.danger, borderWidth: 0 },
        text: { color: theme.colors.onDanger },
        spinnerColor: theme.colors.onDanger,
      } as const;
    case "primary":
    default:
      return {
        container: { backgroundColor: theme.colors.primary, borderWidth: 0 },
        text: { color: theme.colors.onPrimary },
        spinnerColor: theme.colors.onPrimary,
      } as const;
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  textBase: {
    fontFamily: typography.fontFamily.bold,
  },
});


