# Day Streak Logic Documentation

## Overview
The day streak system tracks consecutive days where the user answers a minimum of 5 questions per day. This ensures meaningful engagement rather than just opening the app.

## Requirements

### Minimum Threshold
- **5 questions per day** must be answered to count that day toward the streak
- Questions can be correct or incorrect (both count)
- Uses user's local timezone for day boundaries

### Data Storage

#### UserProgress Interface
```typescript
{
  streak: number;                    // Current day streak count
  lastQuestionDate: string | null;   // Date (YYYY-MM-DD) of last question answered
  questionsAnsweredToday: number;    // Count of questions answered today
  lastValidStreakDate: string | null; // Last date that counted toward streak (had 5+ questions)
}
```

#### Storage Keys
- `@sat_prep:user_progress` - Full user progress object

## Core Logic Flow

### 1. When User Answers a Question (`recordPractice`)

When a user answers a question:
1. Check if it's a new day - if so, reset `questionsAnsweredToday` to 0
2. Increment `questionsAnsweredToday`
3. Update `lastQuestionDate` to today
4. If `questionsAnsweredToday` reaches 5, call `updateStreakForDay()`

```typescript
async recordPractice(isCorrect: boolean, questionId?: string) {
  const today = getTodayString(); // User's local timezone
  const lastQuestionDate = this.progress.lastQuestionDate;
  
  // Reset daily counter if new day
  if (!lastQuestionDate || !isToday(lastQuestionDate)) {
    this.progress.questionsAnsweredToday = 0;
  }
  
  // Increment today's count
  this.progress.questionsAnsweredToday += 1;
  this.progress.lastQuestionDate = today;
  
  // Check if we've hit the 5-question threshold
  if (this.progress.questionsAnsweredToday === 5) {
    await this.updateStreakForDay(today);
  }
  
  // ... rest of practice recording logic
}
```

### 2. Streak Update Logic (`updateStreakForDay`)

When the 5th question is answered on a day:
1. If no previous valid streak date: Start streak at 1
2. If last valid date was yesterday: Increment streak
3. If last valid date was today: Do nothing (already counted)
4. If last valid date was more than 1 day ago: Reset streak to 1

```typescript
async updateStreakForDay(date: string) {
  const lastValidDate = this.progress.lastValidStreakDate;
  
  if (!lastValidDate) {
    // First time hitting 5 questions - start streak
    this.progress.streak = 1;
    this.progress.lastValidStreakDate = date;
  } else if (isYesterday(lastValidDate)) {
    // Consecutive day - increment streak
    this.progress.streak += 1;
    this.progress.lastValidStreakDate = date;
  } else if (isToday(lastValidDate)) {
    // Same day - don't increment (already counted)
    // Do nothing
  } else {
    // Gap in streak - reset
    this.progress.streak = 1;
    this.progress.lastValidStreakDate = date;
  }
  
  await this.saveProgress();
}
```

### 3. App Start Validation (`validateStreakOnStart`)

On app initialization:
1. Reset daily counter if last question wasn't today
2. Check if streak is broken:
   - If last valid date was today: Streak still valid
   - If last valid date was yesterday: Streak still active (but need to complete today)
   - If last valid date was more than 1 day ago: Reset streak to 0

```typescript
async validateStreakOnStart() {
  const today = getTodayString();
  const lastQuestionDate = this.progress.lastQuestionDate;
  const lastValidDate = this.progress.lastValidStreakDate;
  
  // Reset daily counter if not today
  if (!lastQuestionDate || !isToday(lastQuestionDate)) {
    this.progress.questionsAnsweredToday = 0;
  }
  
  // Check if streak is broken
  if (lastValidDate) {
    if (isToday(lastValidDate)) {
      // Streak is still valid (completed today)
      return;
    } else if (isYesterday(lastValidDate)) {
      // Last valid day was yesterday - streak still active
      // But need to complete today to continue
      return;
    } else {
      // More than 1 day gap - streak broken
      this.progress.streak = 0;
      this.progress.lastValidStreakDate = null;
      await this.saveProgress();
    }
  } else if (lastQuestionDate && !isToday(lastQuestionDate) && !isYesterday(lastQuestionDate)) {
    // No valid streak date but last question was more than 1 day ago
    this.progress.streak = 0;
    await this.saveProgress();
  }
}
```

## Edge Cases

### 1. Partial Day Completion
**Scenario**: User answers 4 questions, then day changes
**Solution**: `questionsAnsweredToday` resets to 0 on new day. User must answer 5 questions on the new day to continue streak.

### 2. Timezone Changes
**Scenario**: User travels across timezones
**Solution**: Always use user's local timezone via `getTodayString()` which uses local date, not UTC.

### 3. Multiple Sessions Same Day
**Scenario**: User answers 3 questions in morning, 2 in evening
**Solution**: Counter persists across sessions. When 5th question is answered, streak updates.

### 4. App Not Opened for Days
**Scenario**: User doesn't open app for 3 days
**Solution**: On app start, `validateStreakOnStart()` detects gap > 1 day and resets streak to 0.

### 5. Answering More Than 5 Questions
**Scenario**: User answers 10 questions in one day
**Solution**: Streak updates when 5th question is answered. Additional questions don't affect streak for that day.

## Display Logic

### Label Format
- **"Day Streak"** when streak = 1
- **"Days Streak"** when streak > 1
- Display: `{streak === 1 ? 'Day' : 'Days'} Streak`

### Progress Screen
```typescript
<ProgressCard 
  label={progress.streak === 1 ? "Day Streak" : "Days Streak"} 
  value={progress.streak} 
  icon="🔥" 
/>
```

## Industry Standards Comparison

### Duolingo
- Requires completing a lesson (not just opening app)
- Streak freezes available (premium feature)
- **Our approach**: Similar - requires meaningful activity (5 questions)

### Habitica
- Requires checking off daily tasks
- Streak resets if missed a day
- **Our approach**: Similar - consecutive days required

### Headspace
- Requires completing a meditation session
- Grace period for missed days (premium)
- **Our approach**: No grace period (simpler, more motivating)

## Implementation Details

### Constants
- `MIN_QUESTIONS_FOR_STREAK = 5` - Minimum questions required per day

### Date Utilities
All date operations use local timezone via `getTodayString()`:
- `isToday(dateString)` - Checks if date is today
- `isYesterday(dateString)` - Checks if date was yesterday
- `getTodayString()` - Returns today's date in YYYY-MM-DD format (local timezone)

## Testing Scenarios

1. **First 5 questions**: Streak should start at 1
2. **5 questions on consecutive days**: Streak should increment
3. **4 questions one day, 5 next day**: First day doesn't count, second day starts streak
4. **5 questions, then 2-day gap**: Streak should reset to 0
5. **App restart mid-day**: Counter should persist
6. **App restart after day change**: Counter should reset, streak validated
7. **10 questions in one day**: Streak updates at 5th question, additional questions don't affect it

## Future Enhancements

- Streak freeze feature (premium)
- Streak recovery (one-time use item)
- Weekly streak bonuses
- Streak milestones notifications

