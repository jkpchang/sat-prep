# XP (Experience Points) System Documentation

## Overview

XP (Experience Points) is the primary gamification currency in SatUP!. Users earn XP through various activities, primarily by answering questions. XP is displayed prominently in the app header and is used for leaderboard rankings.

## XP Values

### Question Answering
- **Correct Answer**: +10 XP
- **Incorrect Answer**: +5 XP

**Rationale**: Users are rewarded for attempting questions, but receive double XP for correct answers to incentivize learning and accuracy.

### Streak Rewards
- **Daily Streak Completion Bonus**: +5 🔥 XP
  - Awarded when user completes their daily goal (10 questions)
  - Available via "Collect +5 🔥 XP" button in the streak celebration modal
  - This is a bonus reward for maintaining consistency

## XP Display

### Header Badge
- XP is displayed in the top-right corner of most screens
- Shows current total XP with a ⭐ icon
- Animated "odometer" effect when XP increases
- Scale animation (pulse) when XP is gained
- "+X XP" popup appears briefly when XP is earned

### Leaderboards
- **Global Leaderboard**: Ranked by total XP
- **Private Leaderboards**: Ranked by total XP (or day streak, user's choice)
- XP is the primary metric for competitive rankings

## XP Animation Effects

### Odometer Effect
When XP is gained:
1. The XP number animates from current value to new value
2. Smooth counting animation (600ms duration)
3. Badge scales up (1.3x) then back to normal
4. "+X XP" text appears and fades out

### Star Animation (Correct Answers Only)
When a question is answered correctly:
- 5 star emojis (⭐) animate from the submit button to the XP badge
- Stars follow a curved path with rotation
- Visual feedback reinforces the reward

## XP Storage

### Local Storage
- Stored in `@sat_prep:user_progress` via AsyncStorage
- Part of the `UserProgress` interface
- Persists across app restarts

### Database Sync
- For authenticated users: Synced to Supabase `profiles.total_xp` column
- Database is the source of truth for authenticated users
- Local storage is synced to database via `scheduleSaveProfileStats()`
- Debounced to avoid excessive writes (10 second delay)

## XP Scenarios

### XP Increases

1. **Answering Questions**
   - Correct: +10 XP
   - Incorrect: +5 XP
   - Triggered: Immediately after submitting answer

2. **Streak Completion Bonus**
   - Amount: +5 XP
   - Triggered: When user clicks "Collect +5 🔥 XP" in streak celebration modal
   - Condition: User has just completed their daily goal (10 questions)

### XP Never Decreases

- XP is a cumulative metric that only increases
- No penalties or deductions
- Encourages continuous engagement

## Implementation Details

### Gamification Service

The `GamificationService` class manages XP:

```typescript
// Constants
const XP_PER_CORRECT = 10;
const XP_PER_QUESTION = 5; // Even for wrong answers

// Main method for question answering
async recordPractice(isCorrect: boolean, questionId?: number): Promise<{
  xpGained: number;
  newAchievements: Achievement[];
  streakExtended: boolean;
  newDayStreak: number;
}>

// Bonus XP method
async addBonusXP(amount: number): Promise<{
  xpGained: number;
  newAchievements: Achievement[];
}>
```

### XP Flow

1. **User answers question** → `recordPractice()` called
2. **XP calculated** → Based on correctness (10 or 5)
3. **XP added to progress** → `this.progress.totalXP += xpGained`
4. **Progress saved** → Local storage + Supabase (debounced)
5. **Animation triggered** → `animateXPGain()` in QuizScreen
6. **UI updated** → XP badge shows new value with animation

### Streak Bonus Flow

1. **User completes 10 questions** → Streak celebration modal appears
2. **User clicks "Collect +5 🔥 XP"** → `handleCollectStreakXP()` called
3. **Bonus XP added** → `gamificationService.addBonusXP(5)`
4. **Animation triggered** → Same odometer effect as question XP
5. **Modal closes** → User returns to quiz screen

## Future Enhancements

Potential XP sources to consider:
- **Daily Login Bonus**: +X XP for opening app
- **Weekly Challenges**: Bonus XP for completing weekly goals
- **Achievement Rewards**: XP bonuses when unlocking achievements
- **Perfect Day Bonus**: Extra XP for answering all questions correctly in a day
- **Streak Milestones**: Bonus XP at 7, 14, 30 day streaks

## Related Files

- `services/gamification.ts` - Core XP logic
- `app/QuizScreen.tsx` - XP animation and display
- `components/StreakCelebrationModal.tsx` - Streak bonus collection
- `services/profileSync.ts` - Database synchronization
- `services/storage.ts` - Local persistence

