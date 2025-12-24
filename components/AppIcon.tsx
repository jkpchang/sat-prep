import React from "react";
import { AntDesign } from "@expo/vector-icons";
import { theme } from "../theme";

export type AppIconName =
  | "nav.home"
  | "nav.leaderboard"
  | "nav.progress"
  | "nav.profile"
  | "stat.xp"
  | "stat.questions"
  | "stat.correct"
  | "stat.accuracy"
  | "stat.dayStreak"
  | "stat.answerStreak"
  | "ui.celebrate"
  | "ui.refresh"
  | "ui.close"
  | "ui.check"
  | "ui.settings";

export type AppIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export type AppIconTone =
  | "default"
  | "muted"
  | "brand"
  | "onStrong"
  | "xp"
  | "questions"
  | "correct"
  | "accuracy"
  | "dayStreak"
  | "answerStreak";

const ICONS: Record<
  AppIconName,
  React.ComponentProps<typeof AntDesign>["name"]
> = {
  "nav.home": "home",
  "nav.leaderboard": "trophy",
  "nav.progress": "line-chart",
  "nav.profile": "user",

  "stat.xp": "star",
  "stat.questions": "form",
  "stat.correct": "check",
  "stat.accuracy": "dashboard",
  "stat.dayStreak": "fire",
  "stat.answerStreak": "thunderbolt",

  "ui.celebrate": "smile",
  "ui.refresh": "reload",
  "ui.close": "close",
  "ui.check": "check",
  "ui.settings": "setting",
};

const SIZE: Record<AppIconSize, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 40,
};

function toneColor(tone: AppIconTone | undefined) {
  switch (tone) {
    case "muted":
      return theme.colors.textMuted;
    case "brand":
      // Dark teal provides better contrast on light surfaces than mint primary.
      return theme.colors.onPrimary;
    case "onStrong":
      return theme.colors.white;

    case "xp":
      // Always associate XP/star with a vibrant yellow.
      return theme.colors.xpGold;
    case "questions":
      // More colorful periwinkle for "Questions" (distinct from Accuracy blue).
      return theme.colors.secondaryPressed;
    case "correct":
      return theme.colors.successStrong;
    case "accuracy":
      return theme.colors.infoStrong;
    case "dayStreak":
      return theme.colors.streak;
    case "answerStreak":
      return theme.colors.accentOrange;

    case "default":
    default:
      return theme.colors.text;
  }
}

export function AppIcon({
  name,
  size = "md",
  tone = "default",
  color,
}: {
  name: AppIconName;
  size?: AppIconSize | number;
  tone?: AppIconTone;
  color?: string;
}) {
  const px = typeof size === "number" ? size : SIZE[size];
  return (
    <AntDesign name={ICONS[name]} size={px} color={color ?? toneColor(tone)} />
  );
}
