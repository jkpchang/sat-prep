import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import { AppIcon, AppIconName, AppIconTone, AppIconSize } from "./AppIcon";

interface ProgressCardProps {
  label: string;
  value: string | number;
  icon?: string;
  iconName?: AppIconName;
  iconTone?: AppIconTone;
  iconSize?: AppIconSize;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  label,
  value,
  icon,
  iconName,
  iconTone,
  iconSize = "md",
}) => {
  return (
    <View style={styles.container}>
      {iconName ? (
        <View style={styles.iconWrap}>
          <AppIcon name={iconName} tone={iconTone} size={iconSize} />
        </View>
      ) : (
        icon && <Text style={styles.iconText}>{icon}</Text>
      )}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Slightly darker than `surfaceSubtle` so this card reads as a distinct tile
    backgroundColor: theme.colors.backgroundAlt,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    minWidth: 100,
  },
  iconWrap: {
    marginBottom: 6,
  },
  iconText: {
    fontSize: 24,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
