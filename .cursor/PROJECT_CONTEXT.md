# Project Context - SAT Prep App

## Project Overview

**Goal**: Build a highly gamified SAT preparation mobile app inspired by Duolingo's engagement model. The app should make studying feel like playing a game, not like forced homework.

**Target Audience**: High school students preparing for the SAT who find traditional test prep boring or forced by parents.

**Key Differentiator**: Duolingo-level engagement and addiction through gamification mechanics.

## Architecture Decisions

### Tech Stack
- **Framework**: React Native with Expo (SDK 54)
- **Language**: TypeScript
- **Navigation**: React Navigation 7.x (Stack + Bottom Tabs)
- **State Management**: React Context API (Zustand installed but not used in MVP)
- **Storage**: AsyncStorage for local persistence
- **React Version**: 19.1.0 (required by Expo 54)

### Project Structure
```
sat-prep/
├── app/              # Screen components
│   ├── HomeScreen.tsx
│   ├── QuizScreen.tsx
│   └── ProgressScreen.tsx
├── components/       # Reusable UI components
│   ├── AchievementBadge.tsx
│   ├── ProgressCard.tsx
│   ├── QuestionCard.tsx
│   └── StreakDisplay.tsx
├── services/         # Business logic
│   ├── gamification.ts  # Core gamification system
│   ├── questions.ts    # Question management
│   └── storage.ts      # AsyncStorage wrapper
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

### Key Design Patterns
- **Service Layer**: Business logic separated into service classes (gamification, storage, questions)
- **Component Composition**: Reusable UI components for consistency
- **Local-First**: All data stored locally via AsyncStorage (no backend yet)

## Core Features (MVP)

### ✅ Implemented
1. **Home Screen** - Daily challenge, streak display, progress overview
2. **Quiz Screen** - Multiple choice questions with immediate feedback
3. **Gamification System** - Streaks, XP, achievements, local persistence
4. **Progress Screen** - Stats dashboard and achievement list

## Known Issues & Technical Debt

### Critical: React 19 Compatibility Issue
**Problem**: React Navigation's animated components have a compatibility issue with React 19, causing a type error: `TypeError: expected dynamic type 'boolean', but had type 'string'` in `createAnimatedComponent.ts`.

**Current Workaround**: Navigation animations disabled with `animation: "none"` in Stack.Navigator screenOptions.

**Location**: `App.tsx` - Stack.Navigator screenOptions

**Impact**: Screen transitions are instant (no animations). Functionality works correctly.

**Future Fix**: 
- Wait for React Navigation to release full React 19 support, OR
- Consider migrating to Expo Router (Expo's recommended navigation solution) which may have better React 19 support

**Status**: ⚠️ Known issue, workaround in place, low priority

## Important Reminders for Future Development

1. **App Purpose**: Highly gamified SAT prep - engagement > content depth (initially)
2. **Architecture**: React Native + Expo, TypeScript, React Navigation, local storage
3. **Known Bug**: Navigation animations disabled due to React 19 compatibility - address when React Navigation supports React 19 or consider Expo Router migration
4. **Development Flow**: Use Expo Go for real device testing, web version for AI-assisted testing
5. **Data**: All data is local-first (AsyncStorage) - no backend yet
