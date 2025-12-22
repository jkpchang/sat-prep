export const theme = {
  colors: {
    // Core neutrals
    white: "#FFFFFF",
    black: "#000000",
    whiteAlpha30: "rgba(255, 255, 255, 0.3)",
    overlayStrong: "rgba(0, 0, 0, 0.85)",
    overlay: "rgba(0, 0, 0, 0.5)",

    background: "#F5F7FA",
    backgroundAlt: "#E8ECF0",

    surface: "#FFFFFF",
    surfaceElevated: "#FDFDFD",
    surfaceSubtle: "#F8F9FA",
    surfaceOffWhite: "#F5F5F5",
    tintMint: "#F0FDFC",

    border: "#E0E0E0",
    borderStrong: "#D0D7DE",

    text: "#2C3E50",
    textMuted: "#7F8C8D",
    textSubtle: "#34495E",
    textGray: "#424242",

    // Brand
    primary: "#4ECDC4",
    primaryPressed: "#3AB8B0",
    onPrimary: "#FFFFFF",
    secondary: "#5B6CFF",
    secondaryPressed: "#4A5AE6",
    onSecondary: "#FFFFFF",

    // Semantic
    success: "#2ECC71",
    successStrong: "#4CAF50",
    successBg: "#C8E6C9",
    onSuccess: "#FFFFFF",

    danger: "#E74C3C",
    dangerStrong: "#F44336",
    dangerBg: "#FFCDD2",
    onDanger: "#FFFFFF",

    warning: "#FFA500",
    warningText: "#FF6B35",
    warningBg: "#FFF5E6",
    onWarning: "#FFFFFF",

    // Info
    info: "#2196F3",
    infoStrong: "#1976D2",
    infoBg: "#E3F2FD",
    infoBgAlt: "#F0F7FF",

    // Game / accents
    streak: "#FF6B6B",
    accentOrange: "#E67E22",

    // Disabled / misc neutrals found in UI
    disabled: "#BDC3C7",
    disabledBorder: "#95A5A6",
    neutral300: "#CCCCCC",
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },

  shadow: {
    color: "#000000",
  },
} as const;

export type Theme = typeof theme;


