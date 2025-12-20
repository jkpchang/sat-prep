# Leaderboard Feature - TODO List

## Phase 1: Database Setup

### Database Schema
- [x] Create `private_leaderboards` table
  - [x] Add columns: id, owner_id, name, description, created_at, updated_at, max_members
  - [x] Add foreign key constraint to auth.users
  - [x] Add check constraint for max_members (1-50)
  - [x] Add index on owner_id

- [x] Create `leaderboard_members` table
  - [x] Add columns: id, leaderboard_id, user_id, joined_at
  - [x] Add foreign key constraints to private_leaderboards and auth.users
  - [x] Add unique constraint on (leaderboard_id, user_id)
  - [x] Add indexes on leaderboard_id and user_id

- [x] Create `user_preferences` table
  - [x] Add columns: user_id, block_leaderboard_invites, hide_from_global_leaderboard, updated_at
  - [x] Add foreign key constraint to auth.users
  - [x] Add default values: block_leaderboard_invites (FALSE), hide_from_global_leaderboard (FALSE)

### Row-Level Security (RLS)
- [x] Enable RLS on `private_leaderboards` table
  - [x] Policy: Users can create leaderboards (INSERT with owner_id = auth.uid())
  - [x] Policy: Users can view leaderboards they're members of (SELECT)
  - [x] Policy: Only owner can update leaderboard (UPDATE where owner_id = auth.uid())
  - [x] Policy: Only owner can delete leaderboard (DELETE where owner_id = auth.uid())

- [x] Enable RLS on `leaderboard_members` table
  - [x] Policy: Members can view all members of leaderboards they're in (SELECT)
  - [x] Policy: Any member can add new members (INSERT) - check user preferences
  - [x] Policy: Only owner can remove members (DELETE)
  - [x] Policy: Only owner can update (for ownership transfer)

- [x] Enable RLS on `user_preferences` table
  - [x] Policy: Users can view/update their own preferences (SELECT/UPDATE where user_id = auth.uid())
  - [x] Policy: Users can view others' block_leaderboard_invites status (SELECT) - for invite checks
  - [x] Policy: Users can view others' hide_from_global_leaderboard status (SELECT) - for leaderboard queries

### Database Functions/Triggers
- [x] Create trigger to update `private_leaderboards.updated_at` on update
- [x] Create trigger to sync normalized stats columns from JSONB (sync_stats_columns_trigger)
- [x] Create function to sync stats columns (sync_stats_columns)
- [ ] Create function to check leaderboard member count before adding (prevent > 50) - Handled in application code for now
- [ ] Create function to validate username exists and is authenticated before adding to leaderboard - Handled in application code

### Indexes for Performance
- [x] Add index on `profiles.username` (for filtering authenticated users)
- [x] Add index on `profiles.total_xp` (normalized column for global XP leaderboard queries)
- [x] Add index on `profiles.day_streak` (normalized column for global streak leaderboard queries)
- [x] Create secure view `public_profile_data` for leaderboard queries (prevents email access)
- [x] Normalize stats JSONB into columns for efficient database ordering
- [ ] Consider materialized view for global leaderboards (if performance issues arise)

## Phase 2: Service Layer

### Core Leaderboard Service (`services/leaderboard.ts`)
- [x] Create `leaderboardService` class or module
- [x] Implement `getGlobalLeaderboardByXP(limit, offset)`
  - [x] Query profiles table, filter by username IS NOT NULL
  - [x] Filter out users with hide_from_global_leaderboard = TRUE
  - [x] Sort by totalXP DESC (using normalized column for database ordering)
  - [x] Apply random tie-breaker for identical scores (in application code)
  - [x] Return user_id, username, totalXP, dayStreak, rank
  - [x] Handle pagination

- [x] Implement `getGlobalLeaderboardByStreak(limit, offset)`
  - [x] Query profiles table, filter by username IS NOT NULL
  - [x] Filter out users with hide_from_global_leaderboard = TRUE
  - [x] Sort by dayStreak DESC (using normalized column for database ordering)
  - [x] Apply random tie-breaker for identical scores (in application code)
  - [x] Return user_id, username, totalXP, dayStreak, rank
  - [x] Handle pagination

- [x] Implement `getUserGlobalRankByXP(userId)`
  - [x] Calculate user's rank in global XP leaderboard (respecting hide_from_global_leaderboard)
  - [x] Return rank number and surrounding users (for "you in middle" view)
  - [x] Handle case where user is hidden from global leaderboard

- [x] Implement `getUserGlobalRankByStreak(userId)`
  - [x] Calculate user's rank in global streak leaderboard (respecting hide_from_global_leaderboard)
  - [x] Return rank number and surrounding users (for "you in middle" view)
  - [x] Handle case where user is hidden from global leaderboard

- [x] Implement `createPrivateLeaderboard(name, description, ownerId)`
  - [x] Validate name (not empty, max length)
  - [x] Create leaderboard record
  - [x] Add owner as first member
  - [x] Return created leaderboard

- [x] Implement `getPrivateLeaderboardsForUser(userId)`
  - [x] Get all leaderboards where user is a member
  - [x] Include leaderboard metadata (name, description, owner_id, member_count)
  - [x] Sort by most recently joined or created

- [x] Implement `getPrivateLeaderboardMembers(leaderboardId, sortBy)`
  - [x] Get all members with their stats from profiles
  - [x] Sort by XP or Streak based on sortBy parameter (client-side)
  - [x] Apply random tie-breaker
  - [x] Return members with ranks

- [x] Implement `addMemberToLeaderboard(leaderboardId, username, addedByUserId)`
  - [x] Validate leaderboard exists and user is member
  - [x] Look up user by username
  - [x] Check if user is authenticated (username IS NOT NULL)
  - [x] Check user preferences for block_leaderboard_invites
  - [x] Check member count < max_members (50)
  - [x] Check user not already a member
  - [x] Add member to leaderboard_members
  - [ ] Trigger notification to added user (deferred - see Phase 6)
  - [x] Return success/error

- [x] Implement `removeMemberFromLeaderboard(leaderboardId, userId, removedByUserId)`
  - [x] Validate removedByUserId is owner
  - [x] Validate user is member
  - [x] Prevent removing owner (must transfer ownership first)
  - [x] Remove member from leaderboard_members
  - [ ] Trigger notification to removed user (deferred - see Phase 6)
  - [x] Return success/error

- [x] Implement `transferOwnership(leaderboardId, newOwnerId, currentOwnerId)`
  - [x] Validate currentOwnerId is current owner
  - [x] Validate newOwnerId is existing member
  - [x] Update private_leaderboards.owner_id
  - [x] Return success/error

- [x] Implement `deletePrivateLeaderboard(leaderboardId, ownerId)`
  - [x] Validate ownerId is owner
  - [x] Delete leaderboard (cascade will delete members)
  - [x] Return success/error

- [x] Implement `getUserRankInPrivateLeaderboard(leaderboardId, userId, sortBy)`
  - [x] Get user's rank in specific private leaderboard
  - [x] Return rank and surrounding users (for "you in middle" view)

### Preferences Service (`services/preferences.ts`)
- [x] Create `preferencesService` class or module
- [x] Implement `getUserPreferences(userId)`
  - [x] Get user preferences from user_preferences table
  - [x] Return default values if no preferences exist
  - [x] Return block_leaderboard_invites and hide_from_global_leaderboard

- [x] Implement `updateUserPreferences(userId, preferences)`
  - [x] Update or insert user preferences
  - [x] Update updated_at timestamp
  - [x] Return success/error

- [x] Implement `checkIfUserBlocksInvites(userId)`
  - [x] Check block_leaderboard_invites preference
  - [x] Return boolean

- [x] Implement `checkIfUserHidesFromGlobal(userId)`
  - [x] Check hide_from_global_leaderboard preference
  - [x] Return boolean

### Helper Functions
- [ ] Create utility function for random tie-breaking in SQL queries
- [ ] Create function to check if user can be added (authenticated, not blocked)
- [ ] Create function to get user's position in sorted list

## Phase 3: Type Definitions

### Update `types/index.ts`
- [x] Add `LeaderboardEntry` interface
- [x] Add `PrivateLeaderboard` interface
- [x] Add `LeaderboardMember` interface
- [x] Add `UserPreferences` interface

## Phase 4: UI Components

### Panel Components
- [x] Create `components/GlobalLeaderboardPanel.tsx`
  - [x] Props: type ('xp' | 'streak'), entries (5 rows), userRank, onShowMore
  - [x] Display 5 rows with user in middle
  - [x] Show rank numbers (1, 2, 3, ...)
  - [x] Highlight current user's row (subtle outline design)
  - [x] "Show More" button (small, right-aligned with icon)

- [x] Create `components/PrivateLeaderboardPanel.tsx`
  - [x] Props: leaderboard, entries (5 rows), userRank, onShowMore, onManage
  - [x] Tabs for XP and Streak sorting (segmented control design)
  - [x] Display 5 rows with user in middle
  - [x] Show rank numbers
  - [x] Highlight current user's row (subtle outline design)
  - [x] "Show More" button (small, right-aligned with icon)
  - [x] Management button (gear icon, if owner)

### Full Screen Components
- [x] Create `app/GlobalLeaderboardScreen.tsx`
  - [x] Props: type ('xp' | 'streak'), navigation
  - [x] Full list of leaderboard entries
  - [x] Pagination (load more on scroll)
  - [ ] Search functionality (optional - deferred)
  - [x] Click row → navigate to user profile
  - [x] Back button

- [x] Create `app/PrivateLeaderboardScreen.tsx`
  - [x] Props: leaderboardId, navigation
  - [x] Tabs for XP and Streak sorting (segmented control design)
  - [x] Full list of members
  - [x] Management section (if owner):
    - [x] Add member by username
    - [x] Remove member (with confirmation)
    - [x] Transfer ownership
    - [x] Delete leaderboard (with confirmation)
  - [x] Click row → navigate to user profile
  - [x] Back button

### Main Leaderboard Screen
- [x] Create `app/LeaderboardScreen.tsx`
  - [x] Sequential panels layout (not tabs)
  - [x] Load global XP leaderboard (5 rows preview)
  - [x] Load global streak leaderboard (5 rows preview)
  - [x] Load all user's private leaderboards
  - [x] Render panels in sequence
  - [x] Handle "Show More" → navigate to full screen
  - [x] Handle row click → navigate to user profile
  - [x] Loading states
  - [x] Error handling
  - [x] Empty states
  - [x] "Create Leaderboard" button always visible for logged-in users
  - [x] Sign-in prompt for anonymous users

### User Profile View
- [x] Create `app/UserProfileScreen.tsx`
  - [x] Props: userId, navigation
  - [x] Display username
  - [x] Display all stats from profiles.stats:
    - [x] totalXP
    - [x] dayStreak
    - [x] questionsAnswered
    - [x] correctAnswers
    - [x] answerStreak
    - [x] accuracy percentage (calculated from correctAnswers/questionsAnswered)
  - [x] Display all achievements (from profiles.stats.achievements array)
    - [x] Load achievement definitions from gamificationService
    - [x] Show unlocked achievements with icons
    - [x] Show locked achievements (grayed out)
  - [x] Back button

### Create/Manage Leaderboard Components
- [x] Create `components/CreateLeaderboardModal.tsx`
  - [x] Form: name (required), description (optional)
  - [x] Validation
  - [x] Submit → create leaderboard
  - [x] Error handling

- [x] Create `components/AddMemberModal.tsx`
  - [x] Form: username input
  - [x] Search/validate username exists
  - [x] Check if user is authenticated (username IS NOT NULL)
  - [x] Check user preferences (block_leaderboard_invites)
  - [x] Check member count < 50
  - [x] Submit → add member
  - [x] Error handling (user not found, already member, blocked, etc.)

- [x] Create `components/TransferOwnershipModal.tsx`
  - [x] List of current members (excluding current owner)
  - [x] Select new owner
  - [x] Confirmation dialog
  - [x] Submit → transfer ownership
  - [x] Error handling

## Phase 5: Navigation

### Update Navigation
- [x] Add LeaderboardScreen to navigation stack
  - [x] Add route in App.tsx as top-level tab (between Home and Progress)
  - [x] Tab navigation configured

- [x] Add GlobalLeaderboardScreen to navigation
  - [x] Stack screen for full global leaderboard view

- [x] Add PrivateLeaderboardScreen to navigation
  - [x] Stack screen for full private leaderboard view

- [x] Add UserProfileScreen to navigation
  - [x] Stack screen for user profile view

- [x] Add CreateLeaderboardModal to navigation
  - [x] Modal component integrated into LeaderboardScreen

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
- [x] Create `services/preferences.ts` (see Phase 2)

- [ ] Add preference UI (can be in ProfileScreen or Settings)
  - [ ] Toggle: "Block all leaderboard invites" (block_leaderboard_invites)
  - [ ] Toggle: "Don't show me on global leaderboard" (hide_from_global_leaderboard)
  - [ ] Save to database
  - [ ] Show current status
  - [ ] Handle loading and error states
  - **Note**: Service layer is complete, UI integration deferred

- [x] Integrate preference checks
  - [x] Check block_leaderboard_invites in `addMemberToLeaderboard`
  - [x] Check hide_from_global_leaderboard in global leaderboard queries
  - [x] Return appropriate error messages

## Phase 8: Integration & Polish

### Integration with Existing Services
- [x] Ensure leaderboard service uses existing `supabaseClient`
- [x] Ensure leaderboard queries work with existing `profiles` table structure
- [x] Test with existing authentication system
- [x] Test with anonymous vs authenticated users (anonymous users see sign-in prompt)
- [x] Ensure achievement display uses existing `gamificationService.getAchievements()`

### Error Handling
- [x] Add error handling for all service functions
- [x] Add user-friendly error messages
- [x] Handle network errors gracefully
- [x] Handle permission errors (RLS violations)
- [x] Handle preference-related errors (user blocked, user hidden)

### Loading States
- [x] Add loading indicators for all async operations
- [x] Loading states for full screen views
- [ ] Skeleton loaders for leaderboard panels (deferred - basic loading states implemented)

### Empty States
- [x] Empty state for user with no private leaderboards
- [x] Empty state for leaderboard with no members
- [x] Empty state for global leaderboard (edge case)
- [x] Empty state when user is hidden from global leaderboard

### Performance Optimization
- [x] Implement pagination for global leaderboards
- [x] Optimize queries (normalized columns with indexes for database-level ordering)
- [x] Use secure view `public_profile_data` to prevent email access
- [x] Database-level ORDER BY instead of client-side sorting
- [ ] Cache leaderboard data appropriately (deferred - can be added if needed)
- [ ] Consider debouncing for frequent updates (deferred)

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
