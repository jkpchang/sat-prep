# Leaderboard System - Architecture & Business Decisions

## Overview

The leaderboard system adds competitive gamification to the SAT prep app, allowing users to compare their progress with others globally and within private groups. This document outlines the architecture and business decisions for the leaderboard feature.

## Business Decisions

### Global Leaderboards

**Decision**: Two all-time global leaderboards based on:
1. **All-Time XP** - Cumulative XP earned since account creation
2. **All-Time Days Streak** - Current active day streak

**Rationale**:
- All-time metrics provide long-term motivation and recognition
- Simpler than time-based leaderboards (no resets, no confusion)
- XP and Streak represent different aspects of engagement (volume vs consistency)
- No leagues/tiers for MVP - keeps complexity low

**Tie-Breaking**:
- If users have identical scores, ranking is randomized
- No secondary tie-breakers (simplicity over perfect ordering)

**Privacy**:
- Only authenticated users with usernames appear in global leaderboards
- Anonymous users (no username) are automatically excluded
- Users can opt-out via preference: "Don't show me on global leaderboard"

### Private Leaderboards

**Decision**: User-created private leaderboards with the following characteristics:

**Creation & Management**:
- Any authenticated user can create a private leaderboard
- No limit on how many private leaderboards a user can create
- Creator becomes the owner
- Owner can set name and description
- Maximum 50 members per leaderboard
- All-time metrics only (XP and Days Streak)

**Membership**:
- Only authenticated users can be added (no anonymous users - they don't have usernames)
- Any participant (not just owner) can add new members by username
- Only owner can remove members
- Owner can transfer ownership to any existing member
- All leaderboards are private and not discoverable (invite-only)

**Ranking**:
- Client-side sorting by XP or Days Streak
- Users can switch between XP and Streak views
- Same tie-breaking as global (random for identical scores)

**Privacy**:
- All private leaderboards are hidden from discovery
- Only way to join is to be added by owner or existing participant
- No public invite codes or links (for MVP)

### User Preferences

**Decision**: Two preference settings for leaderboard privacy:

1. **`block_leaderboard_invites`** - Block all leaderboard invites
   - Prevents spam and unwanted invitations
   - When enabled, users cannot be added to any private leaderboard
   - Users attempting to add will receive an error message

2. **`hide_from_global_leaderboard`** - Don't show me on global leaderboard
   - When enabled, user's stats are excluded from global leaderboard queries
   - User can still view global leaderboards, but won't appear in them
   - Does not affect private leaderboard participation

**Rationale**:
- Gives users granular control over their social engagement
- Respects user privacy preferences
- Prevents unwanted social interactions

### Notifications

**Decision**: Push notifications for:
1. When someone adds you to a leaderboard
2. When someone kicks you off a leaderboard

**Rationale**:
- Immediate feedback for social actions
- Keeps users engaged with leaderboard activity
- No ranking movement notifications (to avoid notification fatigue)

## Architecture

### Database Schema

#### New Tables

**`private_leaderboards`**
CREATE TABLE private_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  max_members INTEGER NOT NULL DEFAULT 50,
  CONSTRAINT max_members_check CHECK (max_members > 0 AND max_members <= 50)
);

CREATE INDEX idx_private_leaderboards_owner ON private_leaderboards(owner_id);**`leaderboard_members`**
CREATE TABLE leaderboard_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES private_leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

CREATE INDEX idx_leaderboard_members_leaderboard ON leaderboard_members(leaderboard_id);
CREATE INDEX idx_leaderboard_members_user ON leaderboard_members(user_id);**`user_preferences`**
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  block_leaderboard_invites BOOLEAN NOT NULL DEFAULT FALSE,
  hide_from_global_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);#### Existing Tables (Modifications)

**`profiles`** (already exists, modified)
- Contains `stats` JSONB with `totalXP` and `dayStreak`
- Contains `stats.achievements` array of achievement IDs
- **Normalized columns added** (migration 002):
  - `total_xp` INTEGER - Indexed for efficient leaderboard queries
  - `day_streak` INTEGER - Indexed for efficient leaderboard queries
  - `questions_answered` INTEGER
  - `correct_answers` INTEGER
  - `answer_streak` INTEGER
- Trigger `sync_stats_columns_trigger` automatically syncs normalized columns from JSONB
- Username field used to identify authenticated users
- Secure view `public_profile_data` exposes only public data (no email)

### Data Flow

#### Global Leaderboard Queries

**Implementation**: Uses normalized columns (`total_xp`, `day_streak`) for efficient database-level ordering.

**All-Time XP Leaderboard**:
- Queries `public_profile_data` view (secure, no email access)
- Uses `total_xp` column with index for fast ordering
- Filters out users with `hide_from_global_leaderboard = TRUE`
- Applies random tie-breaker in application code for identical scores
- Supports pagination via `limit` and `offset`

**All-Time Days Streak Leaderboard**:
- Queries `public_profile_data` view (secure, no email access)
- Uses `day_streak` column with index for fast ordering
- Filters out users with `hide_from_global_leaderboard = TRUE`
- Applies random tie-breaker in application code for identical scores
- Supports pagination via `limit` and `offset`

**User's Position**:
- Calculated by fetching entries and finding user's index
- Returns surrounding entries (2 before, 2 after) for "you in middle" view
- Handles case where user is hidden from global leaderboard
- Note: Currently fetches large batch (10000) for rank calculation - acceptable for preview panels, full screen uses pagination

#### Private Leaderboard Queries

**Get Leaderboard Members with Stats**:
- Queries `leaderboard_members` joined with `public_profile_data` view
- Uses normalized columns (`total_xp`, `day_streak`) for efficient sorting
- Client-side sorting by XP or Streak (switchable)
- Applies random tie-breaker for identical scores### Service Layer

#### New Services

**`services/leaderboard.ts`**
- `getGlobalLeaderboardByXP(limit, offset)` - Get global XP leaderboard (respects hide_from_global_leaderboard)
- `getGlobalLeaderboardByStreak(limit, offset)` - Get global streak leaderboard (respects hide_from_global_leaderboard)
- `getUserGlobalRankByXP(userId)` - Get user's global XP rank
- `getUserGlobalRankByStreak(userId)` - Get user's global streak rank
- `createPrivateLeaderboard(name, description, ownerId)` - Create private leaderboard
- `getPrivateLeaderboardsForUser(userId)` - Get all leaderboards user is in
- `getPrivateLeaderboardMembers(leaderboardId, sortBy)` - Get members with stats
- `addMemberToLeaderboard(leaderboardId, username, addedByUserId)` - Add member (checks block_leaderboard_invites)
- `removeMemberFromLeaderboard(leaderboardId, userId, removedByUserId)` - Remove member (owner only)
- `transferOwnership(leaderboardId, newOwnerId, currentOwnerId)` - Transfer ownership
- `deletePrivateLeaderboard(leaderboardId, ownerId)` - Delete leaderboard

**`services/preferences.ts`**
- `getUserPreferences(userId)` - Get user preferences
- `updateUserPreferences(userId, preferences)` - Update preferences
- `checkIfUserBlocksInvites(userId)` - Check block_leaderboard_invites status
- `checkIfUserHidesFromGlobal(userId)` - Check hide_from_global_leaderboard status

### UI Architecture

#### Screen Structure

**LeaderboardScreen** (new screen)
- Sequential panels (not tabs)
- Order:
  1. Global XP Leaderboard (5 rows preview)
  2. Global Days Streak Leaderboard (5 rows preview)
  3. Private Leaderboard 1 (tabs: XP | Streak, 5 rows preview)
  4. Private Leaderboard 2 (tabs: XP | Streak, 5 rows preview)
  5. ... (all user's private leaderboards)

**Panel Components**:
- `GlobalLeaderboardPanel` - Shows 5 rows with "you" in middle
  - Subtle highlight for current user (light background + border outline)
  - "Show More" button (small, right-aligned with arrow icon)
- `PrivateLeaderboardPanel` - Shows 5 rows with tabs for XP/Streak
  - Segmented control design for XP/Streak tabs
  - Gear icon for management (owner only)
  - Subtle highlight for current user
  - "Show More" button (small, right-aligned with arrow icon)

**Full Screen Views**:
- `GlobalLeaderboardScreen` - Full list with pagination (load more on scroll)
- `PrivateLeaderboardScreen` - Full list with management options (if owner)

**User Profile View**:
- Click any row → Show user's public profile
- Display: username, all stats from `profiles.stats`, all achievements
- Achievements loaded from `profiles.stats.achievements` array (sufficient for MVP)
- Stats shown: totalXP, dayStreak, questionsAnswered, correctAnswers, answerStreak, accuracy percentage

### Row-Level Security (RLS)

#### Policies Needed

**`private_leaderboards`**:
- Users can create leaderboards (INSERT)
- Users can view leaderboards they're members of (SELECT)
- Only owner can update/delete (UPDATE/DELETE)

**`leaderboard_members`**:
- Members can view all members of leaderboards they're in (SELECT)
- Any member can add new members (INSERT) - but check preferences
- Only owner can remove members (DELETE)
- Only owner can transfer ownership (UPDATE owner_id)

**`user_preferences`**:
- Users can view/update their own preferences (SELECT/UPDATE)
- Users can view others' block_leaderboard_invites status (SELECT) - to check before inviting
- Users can view others' hide_from_global_leaderboard status (SELECT) - for leaderboard queries

### Notification System

#### Push Notifications

**Status**: Deferred for MVP (notifications infrastructure not yet set up)

**When to Send** (Future):
1. User added to leaderboard → Send to added user
2. User removed from leaderboard → Send to removed user

**Implementation** (Future):
- Use Expo Notifications or Supabase Realtime
- Store notification preferences in `user_preferences`
- Respect user's notification settings

**Notification Payload** (Future):
```typescript
{
  type: 'leaderboard_added' | 'leaderboard_removed',
  leaderboardId: string,
  leaderboardName: string,
  addedBy?: string,  // username
  removedBy?: string  // username
}
```### Performance Considerations

#### Global Leaderboard Optimization

**Implementation**: Normalized columns with database-level ordering

**Solutions Implemented**:
1. **Normalized Columns** (PostgreSQL):
   - `total_xp` and `day_streak` as INTEGER columns (not JSONB)
   - Indexed for fast ORDER BY queries
   - Automatically synced from JSONB via trigger
   - Allows efficient database-level sorting without loading all users

2. **Secure View**:
   - `public_profile_data` view prevents email access
   - Only exposes necessary columns for leaderboards
   - Indexed columns available for ordering

3. **Pagination**:
   - Database-level pagination using `limit` and `offset`
   - Only fetches requested page of results
   - Efficient even with large user base

**Future Optimizations** (if needed):
- Materialized views for pre-computed rankings
- Caching top 100 for each global leaderboard
- Cursor-based pagination for better performance

#### Private Leaderboard Optimization

**Implementation**: Client-side sorting with normalized columns

**Solutions Implemented**:
1. **Normalized Columns**:
   - Uses `total_xp` and `day_streak` from secure view
   - Efficient data fetching

2. **Client-Side Sorting**:
   - Fetch all member data once
   - Sort on client (XP or Streak) - switchable
   - Reduces server load for small groups (max 50 members)

### Security Considerations

#### Anti-Cheating (Deferred)

**Current**: No anti-cheating measures for MVP

**Future Considerations**:
- Rate limiting XP gains
- Validate question answers
- Monitor for impossible streaks
- Flag suspicious activity patterns

#### Privacy

- Anonymous users cannot participate in leaderboards (no username)
- Users can block all invites via preferences
- Users can hide from global leaderboards
- Private leaderboards are not discoverable
- Only members can see other members

### Migration Strategy

#### Phase 1: Database Setup
1. Create new tables
2. Set up RLS policies
3. Add indexes

#### Phase 2: Service Layer
1. Implement leaderboard service
2. Implement preferences service
3. Add helper functions for ranking
4. Test queries

#### Phase 3: UI Components
1. Create panel components
2. Create full screen views
3. Add navigation

#### Phase 4: Notifications
1. Set up push notification infrastructure
2. Implement notification triggers
3. Add notification preferences

#### Phase 5: Polish
1. Add loading states
2. Error handling
3. Empty states
4. User profile view

## Dependencies

- Supabase database (existing)
- Expo Notifications (for push notifications - may need to be added)
- React Navigation (existing - for screen navigation)
- Existing `profiles` table structure
- Existing `gamificationService` for stats
- Existing achievement system (stored in `profiles.stats.achievements`)

## Testing Considerations

1. **Unit Tests**:
   - Leaderboard service functions
   - Ranking calculations
   - Tie-breaking logic
   - Preference checks

2. **Integration Tests**:
   - Database queries
   - RLS policies
   - Notification triggers
   - Preference filtering

3. **E2E Tests**:
   - Create private leaderboard
   - Add/remove members
   - Transfer ownership
   - View leaderboards
   - Test preference settings

4. **Performance Tests**:
   - Global leaderboard query performance
   - Multiple private leaderboard loading
   - Pagination performance

```markdown:/Users/jchang/work/sat-prep/TODO_LEADERBOARD.md
# Leaderboard Feature - TODO List

## Phase 1: Database Setup

### Database Schema
- [ ] Create `private_leaderboards` table
  - [ ] Add columns: id, owner_id, name, description, created_at, updated_at, max_members
  - [ ] Add foreign key constraint to auth.users
  - [ ] Add check constraint for max_members (1-50)
  - [ ] Add index on owner_id

- [ ] Create `leaderboard_members` table
  - [ ] Add columns: id, leaderboard_id, user_id, joined_at
  - [ ] Add foreign key constraints to private_leaderboards and auth.users
  - [ ] Add unique constraint on (leaderboard_id, user_id)
  - [ ] Add indexes on leaderboard_id and user_id

- [ ] Create `user_preferences` table
  - [ ] Add columns: user_id, block_leaderboard_invites, hide_from_global_leaderboard, updated_at
  - [ ] Add foreign key constraint to auth.users
  - [ ] Add default values: block_leaderboard_invites (FALSE), hide_from_global_leaderboard (FALSE)

### Row-Level Security (RLS)
- [ ] Enable RLS on `private_leaderboards` table
  - [ ] Policy: Users can create leaderboards (INSERT with owner_id = auth.uid())
  - [ ] Policy: Users can view leaderboards they're members of (SELECT)
  - [ ] Policy: Only owner can update leaderboard (UPDATE where owner_id = auth.uid())
  - [ ] Policy: Only owner can delete leaderboard (DELETE where owner_id = auth.uid())

- [ ] Enable RLS on `leaderboard_members` table
  - [ ] Policy: Members can view all members of leaderboards they're in (SELECT)
  - [ ] Policy: Any member can add new members (INSERT) - check user preferences
  - [ ] Policy: Only owner can remove members (DELETE)
  - [ ] Policy: Only owner can update (for ownership transfer)

- [ ] Enable RLS on `user_preferences` table
  - [ ] Policy: Users can view/update their own preferences (SELECT/UPDATE where user_id = auth.uid())
  - [ ] Policy: Users can view others' block_leaderboard_invites status (SELECT) - for invite checks
  - [ ] Policy: Users can view others' hide_from_global_leaderboard status (SELECT) - for leaderboard queries

### Database Functions/Triggers
- [ ] Create function to check leaderboard member count before adding (prevent > 50)
- [ ] Create trigger to update `private_leaderboards.updated_at` on update
- [ ] Create function to validate username exists and is authenticated before adding to leaderboard

### Indexes for Performance
- [ ] Add index on `profiles.stats->>'totalXP'` (for global XP leaderboard queries)
- [ ] Add index on `profiles.stats->>'dayStreak'` (for global streak leaderboard queries)
- [ ] Add index on `profiles.username` (for filtering authenticated users)
- [ ] Consider materialized view for global leaderboards (if performance issues arise)

## Phase 2: Service Layer

### Core Leaderboard Service (`services/leaderboard.ts`)
- [ ] Create `leaderboardService` class or module
- [ ] Implement `getGlobalLeaderboardByXP(limit, offset)`
  - [ ] Query profiles table, filter by username IS NOT NULL
  - [ ] Filter out users with hide_from_global_leaderboard = TRUE
  - [ ] Sort by totalXP DESC
  - [ ] Apply random tie-breaker for identical scores
  - [ ] Return user_id, username, totalXP, dayStreak, rank
  - [ ] Handle pagination

- [ ] Implement `getGlobalLeaderboardByStreak(limit, offset)`
  - [ ] Query profiles table, filter by username IS NOT NULL
  - [ ] Filter out users with hide_from_global_leaderboard = TRUE
  - [ ] Sort by dayStreak DESC
  - [ ] Apply random tie-breaker for identical scores
  - [ ] Return user_id, username, totalXP, dayStreak, rank
  - [ ] Handle pagination

- [ ] Implement `getUserGlobalRankByXP(userId)`
  - [ ] Calculate user's rank in global XP leaderboard (respecting hide_from_global_leaderboard)
  - [ ] Return rank number and surrounding users (for "you in middle" view)
  - [ ] Handle case where user is hidden from global leaderboard

- [ ] Implement `getUserGlobalRankByStreak(userId)`
  - [ ] Calculate user's rank in global streak leaderboard (respecting hide_from_global_leaderboard)
  - [ ] Return rank number and surrounding users (for "you in middle" view)
  - [ ] Handle case where user is hidden from global leaderboard

- [ ] Implement `createPrivateLeaderboard(name, description, ownerId)`
  - [ ] Validate name (not empty, max length)
  - [ ] Create leaderboard record
  - [ ] Add owner as first member
  - [ ] Return created leaderboard

- [ ] Implement `getPrivateLeaderboardsForUser(userId)`
  - [ ] Get all leaderboards where user is a member
  - [ ] Include leaderboard metadata (name, description, owner_id, member_count)
  - [ ] Sort by most recently joined or created

- [ ] Implement `getPrivateLeaderboardMembers(leaderboardId, sortBy)`
  - [ ] Get all members with their stats from profiles
  - [ ] Sort by XP or Streak based on sortBy parameter
  - [ ] Apply random tie-breaker
  - [ ] Return members with ranks

- [ ] Implement `addMemberToLeaderboard(leaderboardId, username, addedByUserId)`
  - [ ] Validate leaderboard exists and user is member
  - [ ] Look up user by username
  - [ ] Check if user is authenticated (username IS NOT NULL)
  - [ ] Check user preferences for block_leaderboard_invites
  - [ ] Check member count < max_members (50)
  - [ ] Check user not already a member
  - [ ] Add member to leaderboard_members
  - [ ] Trigger notification to added user
  - [ ] Return success/error

- [ ] Implement `removeMemberFromLeaderboard(leaderboardId, userId, removedByUserId)`
  - [ ] Validate removedByUserId is owner
  - [ ] Validate user is member
  - [ ] Prevent removing owner (must transfer ownership first)
  - [ ] Remove member from leaderboard_members
  - [ ] Trigger notification to removed user
  - [ ] Return success/error

- [ ] Implement `transferOwnership(leaderboardId, newOwnerId, currentOwnerId)`
  - [ ] Validate currentOwnerId is current owner
  - [ ] Validate newOwnerId is existing member
  - [ ] Update private_leaderboards.owner_id
  - [ ] Return success/error

- [ ] Implement `deletePrivateLeaderboard(leaderboardId, ownerId)`
  - [ ] Validate ownerId is owner
  - [ ] Delete leaderboard (cascade will delete members)
  - [ ] Return success/error

- [ ] Implement `getUserRankInPrivateLeaderboard(leaderboardId, userId, sortBy)`
  - [ ] Get user's rank in specific private leaderboard
  - [ ] Return rank and surrounding users (for "you in middle" view)

### Preferences Service (`services/preferences.ts`)
- [ ] Create `preferencesService` class or module
- [ ] Implement `getUserPreferences(userId)`
  - [ ] Get user preferences from user_preferences table
  - [ ] Return default values if no preferences exist
  - [ ] Return block_leaderboard_invites and hide_from_global_leaderboard

- [ ] Implement `updateUserPreferences(userId, preferences)`
  - [ ] Update or insert user preferences
  - [ ] Update updated_at timestamp
  - [ ] Return success/error

- [ ] Implement `checkIfUserBlocksInvites(userId)`
  - [ ] Check block_leaderboard_invites preference
  - [ ] Return boolean

- [ ] Implement `checkIfUserHidesFromGlobal(userId)`
  - [ ] Check hide_from_global_leaderboard preference
  - [ ] Return boolean

### Helper Functions
- [ ] Create utility function for random tie-breaking in SQL queries
- [ ] Create function to check if user can be added (authenticated, not blocked)
- [ ] Create function to get user's position in sorted list

## Phase 3: Type Definitions

### Update `types/index.ts`
- [ ] Add `LeaderboardEntry` interface
  ```typescript
  interface LeaderboardEntry {
    userId: string;
    username: string | null;
    totalXP: number;
    dayStreak: number;
    rank: number;
  }
  ```

- [ ] Add `PrivateLeaderboard` interface
  ```typescript
  interface PrivateLeaderboard {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    maxMembers: number;
    memberCount: number;
  }
  ```

- [ ] Add `LeaderboardMember` interface
  ```typescript
  interface LeaderboardMember {
    userId: string;
    username: string | null;
    totalXP: number;
    dayStreak: number;
    rank: number;
    joinedAt: string;
  }
  ```

- [ ] Add `UserPreferences` interface
  ```typescript
  interface UserPreferences {
    userId: string;
    blockLeaderboardInvites: boolean;
    hideFromGlobalLeaderboard: boolean;
    updatedAt: string;
  }
  ```

## Phase 4: UI Components

### Panel Components
- [ ] Create `components/GlobalLeaderboardPanel.tsx`
  - [ ] Props: type ('xp' | 'streak'), entries (5 rows), userRank, onShowMore
  - [ ] Display 5 rows with user in middle
  - [ ] Show rank numbers (1, 2, 3, ...)
  - [ ] Highlight current user's row
  - [ ] "Show More" button

- [ ] Create `components/PrivateLeaderboardPanel.tsx`
  - [ ] Props: leaderboard, entries (5 rows), userRank, onShowMore, onManage
  - [ ] Tabs for XP and Streak sorting
  - [ ] Display 5 rows with user in middle
  - [ ] Show rank numbers
  - [ ] Highlight current user's row
  - [ ] "Show More" button
  - [ ] Management button (if owner)

### Full Screen Components
- [ ] Create `app/GlobalLeaderboardScreen.tsx`
  - [ ] Props: type ('xp' | 'streak'), navigation
  - [ ] Full list of leaderboard entries
  - [ ] Pagination (load more on scroll)
  - [ ] Search functionality (optional)
  - [ ] Click row → navigate to user profile
  - [ ] Back button

- [ ] Create `app/PrivateLeaderboardScreen.tsx`
  - [ ] Props: leaderboardId, navigation
  - [ ] Tabs for XP and Streak sorting
  - [ ] Full list of members
  - [ ] Management section (if owner):
    - [ ] Add member by username
    - [ ] Remove member (with confirmation)
    - [ ] Transfer ownership
    - [ ] Delete leaderboard (with confirmation)
  - [ ] Click row → navigate to user profile
  - [ ] Back button

### Main Leaderboard Screen
- [ ] Create `app/LeaderboardScreen.tsx`
  - [ ] Sequential panels layout (not tabs)
  - [ ] Load global XP leaderboard (5 rows preview)
  - [ ] Load global streak leaderboard (5 rows preview)
  - [ ] Load all user's private leaderboards
  - [ ] Render panels in sequence
  - [ ] Handle "Show More" → navigate to full screen
  - [ ] Handle row click → navigate to user profile
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Empty states

### User Profile View
- [ ] Create `app/UserProfileScreen.tsx`
  - [ ] Props: userId, navigation
  - [ ] Display username
  - [ ] Display all stats from profiles.stats:
    - [ ] totalXP
    - [ ] dayStreak
    - [ ] questionsAnswered
    - [ ] correctAnswers
    - [ ] answerStreak
    - [ ] accuracy percentage (calculated from correctAnswers/questionsAnswered)
  - [ ] Display all achievements (from profiles.stats.achievements array)
    - [ ] Load achievement definitions from gamificationService
    - [ ] Show unlocked achievements with icons
    - [ ] Show locked achievements (grayed out) or only show unlocked
  - [ ] Back button

### Create/Manage Leaderboard Components
- [ ] Create `components/CreateLeaderboardModal.tsx` or screen
  - [ ] Form: name (required), description (optional)
  - [ ] Validation
  - [ ] Submit → create leaderboard
  - [ ] Error handling

- [ ] Create `components/AddMemberModal.tsx`
  - [ ] Form: username input
  - [ ] Search/validate username exists
  - [ ] Check if user is authenticated (username IS NOT NULL)
  - [ ] Check user preferences (block_leaderboard_invites)
  - [ ] Check member count < 50
  - [ ] Submit → add member
  - [ ] Error handling (user not found, already member, blocked, etc.)

- [ ] Create `components/TransferOwnershipModal.tsx`
  - [ ] List of current members (excluding current owner)
  - [ ] Select new owner
  - [ ] Confirmation dialog
  - [ ] Submit → transfer ownership
  - [ ] Error handling

## Phase 5: Navigation

### Update Navigation
- [ ] Add LeaderboardScreen to navigation stack
  - [ ] Add route in App.tsx or navigation config
  - [ ] Add navigation button/link from appropriate screen (HomeScreen or ProgressScreen)

- [ ] Add GlobalLeaderboardScreen to navigation
  - [ ] Stack screen for full global leaderboard view

- [ ] Add PrivateLeaderboardScreen to navigation
  - [ ] Stack screen for full private leaderboard view

- [ ] Add UserProfileScreen to navigation
  - [ ] Stack screen for user profile view

- [ ] Add CreateLeaderboardScreen/Modal to navigation
  - [ ] Modal or stack screen for creating leaderboard

## Phase 6: Notifications

### Notification Infrastructure
- [ ] Set up Expo Notifications (if not already set up)
  - [ ] Install `expo-notifications` package
  - [ ] Request notification permissions
  - [ ] Configure notification channels (Android)

- [ ] Create notification service (`services/notifications.ts`)
  - [ ] Function to send local notification
  - [ ] Function to schedule notification
  - [ ] Handle notification permissions

### Notification Triggers
- [ ] Add notification when user is added to leaderboard
  - [ ] Trigger in `addMemberToLeaderboard` service
  - [ ] Notification: "You've been added to [Leaderboard Name] by [Username]"
  - [ ] Deep link to leaderboard screen

- [ ] Add notification when user is removed from leaderboard
  - [ ] Trigger in `removeMemberFromLeaderboard` service
  - [ ] Notification: "You've been removed from [Leaderboard Name]"
  - [ ] No deep link needed

### Notification Preferences
- [ ] Add notification settings to user preferences (optional for MVP)
  - [ ] Allow users to disable leaderboard notifications
  - [ ] Store in `user_preferences` table or separate table

## Phase 7: User Preferences

### Preference Management
- [ ] Create `services/preferences.ts` (see Phase 2)

- [ ] Add preference UI (can be in ProfileScreen or Settings)
  - [ ] Toggle: "Block all leaderboard invites" (block_leaderboard_invites)
  - [ ] Toggle: "Don't show me on global leaderboard" (hide_from_global_leaderboard)
  - [ ] Save to database
  - [ ] Show current status
  - [ ] Handle loading and error states

- [ ] Integrate preference checks
  - [ ] Check block_leaderboard_invites in `addMemberToLeaderboard`
  - [ ] Check hide_from_global_leaderboard in global leaderboard queries
  - [ ] Return appropriate error messages

## Phase 8: Integration & Polish

### Integration with Existing Services
- [ ] Ensure leaderboard service uses existing `supabaseClient`
- [ ] Ensure leaderboard queries work with existing `profiles` table structure
- [ ] Test with existing authentication system
- [ ] Test with anonymous vs authenticated users
- [ ] Ensure achievement display uses existing `gamificationService.getAchievements()`

### Error Handling
- [ ] Add error handling for all service functions
- [ ] Add user-friendly error messages
- [ ] Handle network errors gracefully
- [ ] Handle permission errors (RLS violations)
- [ ] Handle preference-related errors (user blocked, user hidden)

### Loading States
- [ ] Add loading indicators for all async operations
- [ ] Skeleton loaders for leaderboard panels
- [ ] Loading states for full screen views

### Empty States
- [ ] Empty state for user with no private leaderboards
- [ ] Empty state for leaderboard with no members (shouldn't happen, but handle)
- [ ] Empty state for global leaderboard (edge case)
- [ ] Empty state when user is hidden from global leaderboard

### Performance Optimization
- [ ] Implement pagination for global leaderboards
- [ ] Cache leaderboard data appropriately
- [ ] Optimize queries (add indexes if needed)
- [ ] Consider debouncing for frequent updates

### Testing
- [ ] Unit tests for leaderboard service functions
- [ ] Unit tests for preferences service functions
- [ ] Integration tests for database queries
- [ ] Test RLS policies
- [ ] Test notification triggers
- [ ] Test preference filtering in global leaderboards
- [ ] Manual testing of all user flows

## Phase 9: Documentation

### Code Documentation
- [ ] Add JSDoc comments to all service functions
- [ ] Document component props and usage
- [ ] Document database schema and relationships

### User Documentation
- [ ] Document how to create private leaderboard
- [ ] Document how to add/remove members
- [ ] Document how to transfer ownership
- [ ] Document preference settings

## Future Enhancements (Not in MVP)

- [ ] Ranking movement notifications
- [ ] Anti-cheating measures
- [ ] Weekly/monthly leaderboards
- [ ] League/tier system
- [ ] Invite codes for private leaderboards
- [ ] Public discoverable leaderboards
- [ ] Leaderboard analytics
- [ ] Enhanced user profile view (activity history, etc.)
- [ ] Social features (chat, comments)
- [ ] Custom ranking rules for private leaderboards
- [ ] Export leaderboard data
- [ ] Leaderboard templates
```

## Implementation Status

### Completed Features

1. **Database Schema**: All tables, RLS policies, indexes, and triggers implemented
2. **Normalized Stats Columns**: Stats JSONB normalized into columns for efficient database ordering
3. **Secure View**: `public_profile_data` view prevents email access while allowing leaderboard queries
4. **Service Layer**: All leaderboard and preferences services implemented
5. **Type Definitions**: All TypeScript interfaces defined
6. **UI Components**: All panel and screen components implemented
7. **Navigation**: Leaderboard integrated as top-level tab
8. **User Profile View**: Shows username, all stats, and all achievements (locked and unlocked)
9. **User Preferences**: Service layer complete (UI integration deferred)
10. **Error Handling**: Comprehensive error handling throughout
11. **Loading & Empty States**: All implemented
12. **Performance**: Database-level ordering with normalized columns and indexes

### Deferred Features

1. **Notifications**: Push notifications for add/remove events (infrastructure not set up)
2. **Preference UI**: Settings UI for user preferences (service layer ready)
3. **Search**: Search functionality in global leaderboard (optional feature)

### Design Decisions Implemented

1. **Current User Highlight**: Subtle outline design (light background + border) instead of solid color
2. **Show More Button**: Small, right-aligned with arrow icon
3. **Manage Button**: Gear icon instead of text
4. **Tab Design**: Segmented control style for XP/Streak tabs
5. **Create Button**: Always visible for logged-in users (no limit on leaderboards)

