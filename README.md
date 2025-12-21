# satUP! - Gamified Learning App

A mobile app built with React Native and Expo that gamifies SAT preparation, making studying feel like playing a game (inspired by Duolingo).

## Features

- **Daily Challenges**: Practice questions to maintain your streak
- **Gamification System**: 
  - Streak tracking (daily practice)
  - XP/Points system
  - Achievements and badges
  - Progress tracking
- **Question Practice**: Multiple choice questions with immediate feedback
- **Progress Dashboard**: View your stats, achievements, and progress
- **Leaderboards**: 
  - Global leaderboards (XP and Day Streak)
  - Private leaderboards (create, invite members, manage)
  - Real-time updates with React Query caching

## Tech Stack

- React Native (Expo) - SDK 54
- React 19.1.0
- TypeScript
- React Navigation 7.x
- Supabase (Backend-as-a-Service: PostgreSQL, Auth, RLS)
- React Query (@tanstack/react-query) - Data fetching and caching
- AsyncStorage (local data persistence)
- Zustand (state management - installed but using Context API for MVP)

## Known Issues

- **React 19 Compatibility**: React Navigation's animated components have a compatibility issue with React 19. Navigation animations are currently disabled (`animation: "none"`) as a workaround. This will be resolved when React Navigation releases full React 19 support.

## Getting Started

### Prerequisites

- Node.js (LTS version)
- Expo Go app installed on your mobile device ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
# or
npx expo start
```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Project Structure

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
│   └── DayStreakDisplay.tsx
├── services/         # Business logic
│   ├── gamification.ts
│   ├── questions.ts
│   └── storage.ts
├── types/           # TypeScript type definitions
│   └── index.ts
└── utils/           # Helper functions
    └── dateUtils.ts
```

## Core Features Implemented

### ✅ Home Screen
- Daily challenge card
- Current streak display
- Progress overview (XP, Questions, Accuracy)
- Quick start button

### ✅ Quiz Screen
- Multiple choice questions
- Immediate feedback on answers
- Explanation for each question
- XP tracking

### ✅ Gamification System
- Streak counter (daily practice tracking)
- XP/points system (10 XP for correct, 5 XP for attempts)
- Achievements/badges system
- Local storage persistence

### ✅ Progress Screen
- Stats dashboard
- Achievement list
- Performance metrics

## Sample Questions

The app currently includes sample SAT questions covering:
- Math (Algebra, Geometry)
- Reading Comprehension
- Writing & Language

*Note: In production, these would come from a database or API with a comprehensive question bank.*

## Future Enhancements

- [ ] Adaptive difficulty system
- [ ] More question types and categories
- [ ] Enhanced social features (notifications, chat)
- [ ] Study reminders and notifications
- [ ] Detailed analytics and insights
- [ ] Timer functionality for timed practice
- [ ] Full-length practice tests

## Development

### Running on Different Platforms

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web (for testing)
npm run web
```

## License

Private project

