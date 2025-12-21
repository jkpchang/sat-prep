import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { typography } from "../styles/typography";

interface ProgressCardProps {
  label: string;
  value: string | number;
  icon?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  label,
  value,
  icon,
}) => {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    minWidth: 100,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: "#7F8C8D",
    textAlign: "center",
  },
});
