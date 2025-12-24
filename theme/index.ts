export const baseTheme = {
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
    // XP / star accent (darker yellow for contrast on light pastel tiles)
    xpGold: "#B8860B",

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

type BaseTheme = typeof baseTheme;
type ThemeColors = { [K in keyof BaseTheme["colors"]]: string };
type ThemeShape = Omit<BaseTheme, "colors"> & { colors: ThemeColors };

const withColors = (overrides: Partial<ThemeColors>): ThemeShape => ({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...overrides,
  } as ThemeColors,
});

export const themes = {
  // Inspired by light, happy game UIs (mint + sky + peach)
  playfulMint: withColors({
    background: "#F6FBFF",
    backgroundAlt: "#EEF6FF",

    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSubtle: "#F7FBFF",
    surfaceOffWhite: "#F9FAFB",
    tintMint: "#E9FFFB",

    border: "#DDE8F3",
    borderStrong: "#CFE0F0",

    text: "#1F2A37",
    textMuted: "#6B7280",
    textSubtle: "#334155",
    textGray: "#374151",

    primary: "#36D6C8",
    primaryPressed: "#22C1B4",
    onPrimary: "#053B36",

    secondary: "#6C7CFF",
    secondaryPressed: "#5566FF",
    onSecondary: "#0B102A",

    success: "#2ED4A7",
    successStrong: "#18B98F",
    successBg: "#D9FFF2",
    onSuccess: "#063B2C",

    danger: "#FF5A7A",
    dangerStrong: "#F43F5E",
    dangerBg: "#FFE0E7",
    onDanger: "#4A0714",

    warning: "#FFC857",
    warningText: "#F97316",
    warningBg: "#FFF4DA",
    onWarning: "#4A2A00",

    info: "#4DA3FF",
    infoStrong: "#2D7FE6",
    infoBg: "#E8F3FF",
    infoBgAlt: "#F3F9FF",

    streak: "#FF5DA2",
    accentOrange: "#FF9F1C",
    xpGold: "#B8860B",

    disabled: "#C9D4E0",
    disabledBorder: "#AEBAC8",
    neutral300: "#D5DEE8",
  }),

  // Like playfulMint, but softer/pastelier with a pastel yellow app background
  playfulMintPastelYellow: withColors({
    background: "#FFF7DB",
    backgroundAlt: "#FFFBF0",

    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSubtle: "#FFFCF2",
    surfaceOffWhite: "#FFFEF7",
    tintMint: "#ECFFFB",

    border: "#F0E2B8",
    borderStrong: "#E6D6A5",

    text: "#1F2A37",
    textMuted: "#6B7280",
    textSubtle: "#334155",
    textGray: "#374151",

    primary: "#66E2D6",
    primaryPressed: "#45D6C7",
    onPrimary: "#063B36",

    // Pastelier periwinkle (less saturated than before)
    secondary: "#A7B4FF",
    secondaryPressed: "#93A3FF",
    onSecondary: "#0B102A",

    success: "#44D9B1",
    successStrong: "#20C997",
    successBg: "#D9FFF2",
    onSuccess: "#063B2C",

    danger: "#FF7FA1",
    dangerStrong: "#FF5A7A",
    dangerBg: "#FFE0E7",
    onDanger: "#4A0714",

    warning: "#FFD88A",
    warningText: "#F97316",
    warningBg: "#FFF2D6",
    onWarning: "#4A2A00",

    info: "#7FB9FF",
    infoStrong: "#4DA3FF",
    infoBg: "#E8F3FF",
    infoBgAlt: "#F3F9FF",

    streak: "#FF75B5",
    accentOrange: "#FFB457",
    xpGold: "#f5f505",

    disabled: "#D6CFB8",
    disabledBorder: "#BFB79E",
    neutral300: "#E6DDBF",
  }),

  // Warm + sunny (lemonade / orange cream), still clean and readable
  sunnyCitrus: withColors({
    background: "#FFF8E8",
    backgroundAlt: "#FFF1D4",

    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSubtle: "#FFF9EF",
    surfaceOffWhite: "#FFFAF2",
    tintMint: "#F2FFFB",

    border: "#F1DFC2",
    borderStrong: "#E8D2AE",

    text: "#2B1D0E",
    textMuted: "#7A5B3A",
    textSubtle: "#3D2B1A",
    textGray: "#3A2F28",

    primary: "#FFB703",
    primaryPressed: "#F59E0B",
    onPrimary: "#3B2500",

    secondary: "#2EC4B6",
    secondaryPressed: "#16A79B",
    onSecondary: "#053B36",

    success: "#34D399",
    successStrong: "#10B981",
    successBg: "#D8FFF1",
    onSuccess: "#063B2C",

    danger: "#FB7185",
    dangerStrong: "#F43F5E",
    dangerBg: "#FFE1E7",
    onDanger: "#4A0714",

    warning: "#FDBA74",
    warningText: "#EA580C",
    warningBg: "#FFF1E1",
    onWarning: "#4A2400",

    info: "#60A5FA",
    infoStrong: "#3B82F6",
    infoBg: "#EAF2FF",
    infoBgAlt: "#F5F9FF",

    streak: "#FF6B6B",
    accentOrange: "#FB8500",
    xpGold: "#B8860B",

    disabled: "#E0D1BB",
    disabledBorder: "#C8B59A",
    neutral300: "#E6D7C2",
  }),

  // Pastel + playful (cotton candy / lavender)
  cottonCandy: withColors({
    background: "#F9F5FF",
    backgroundAlt: "#F1ECFF",

    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSubtle: "#FBF8FF",
    surfaceOffWhite: "#FCFAFF",
    tintMint: "#ECFFFB",

    border: "#E5DDF6",
    borderStrong: "#D8CCF2",

    text: "#241A3A",
    textMuted: "#6B5A86",
    textSubtle: "#362552",
    textGray: "#332B3D",

    primary: "#FF7AC3",
    primaryPressed: "#FF5FB5",
    onPrimary: "#3B001E",

    secondary: "#7C5CFF",
    secondaryPressed: "#6A48FF",
    onSecondary: "#120036",

    success: "#4ADE80",
    successStrong: "#22C55E",
    successBg: "#DDFFE8",
    onSuccess: "#063B1E",

    danger: "#FF5C7A",
    dangerStrong: "#F43F5E",
    dangerBg: "#FFE1E9",
    onDanger: "#4A0714",

    warning: "#FFD166",
    warningText: "#F97316",
    warningBg: "#FFF4D8",
    onWarning: "#4A2A00",

    info: "#5BC0FF",
    infoStrong: "#3AA7FF",
    infoBg: "#E6F6FF",
    infoBgAlt: "#F2FBFF",

    streak: "#FF4D8D",
    accentOrange: "#FF9F1C",
    xpGold: "#B8860B",

    disabled: "#D7D0E8",
    disabledBorder: "#BFB4D6",
    neutral300: "#DED6F0",
  }),

  // Cool + bouncy (sky + mango)
  skyMango: withColors({
    background: "#F2FBFF",
    backgroundAlt: "#E7F6FF",

    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSubtle: "#F6FCFF",
    surfaceOffWhite: "#F8FBFF",
    tintMint: "#E9FFFB",

    border: "#D2ECFF",
    borderStrong: "#BFE2FF",

    text: "#0F2538",
    textMuted: "#51708A",
    textSubtle: "#16354D",
    textGray: "#223446",

    primary: "#3ABEFF",
    primaryPressed: "#1DA7F2",
    onPrimary: "#042133",

    secondary: "#FFB703",
    secondaryPressed: "#F59E0B",
    onSecondary: "#3B2500",

    success: "#22C55E",
    successStrong: "#16A34A",
    successBg: "#DFFFE8",
    onSuccess: "#063B1E",

    danger: "#FF5A5F",
    dangerStrong: "#F43F5E",
    dangerBg: "#FFE0E0",
    onDanger: "#4A0714",

    warning: "#FDBA74",
    warningText: "#EA580C",
    warningBg: "#FFF1E1",
    onWarning: "#4A2400",

    info: "#4F46E5",
    infoStrong: "#4338CA",
    infoBg: "#EEF2FF",
    infoBgAlt: "#F5F7FF",

    streak: "#FF3D7F",
    accentOrange: "#FF7A18",
    xpGold: "#B8860B",

    disabled: "#C7D7E6",
    disabledBorder: "#AABFD3",
    neutral300: "#D3E3F2",
  }),
} as const;

// Active theme (swap this to try different looks)
export const theme = themes.playfulMintPastelYellow;

export type Theme = typeof theme;
