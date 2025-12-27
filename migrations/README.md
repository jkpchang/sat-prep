# Database Migrations

This directory contains clean migration files that recreate the production database schema exactly.

## Migration Files

### 001_create_profiles_table.sql
- Creates the `profiles` table with all columns (including all stats columns)
- Sets up indexes for efficient queries (username, total_xp, day_streak)
- Enables RLS and creates policies for profile access
- **Note:** This table is the foundation - all other tables depend on it

### 002_create_leaderboard_tables.sql
- Creates `private_leaderboards` table
- Creates `leaderboard_members` table
- Creates `user_preferences` table
- Creates `update_updated_at_column()` function
- Sets up triggers for `updated_at` columns
- Enables RLS and creates all leaderboard-related policies
- Includes ownership transfer policy fix

### 003_create_public_profile_data_view.sql
- Creates `public_profile_data` view
- Exposes only public profile data (no email) for leaderboard queries
- Filters out users without usernames
- Grants SELECT access to authenticated users

### 004_create_question_reports_table.sql
- Creates `question_reports` table
- Sets up indexes for efficient queries
- Enables RLS and creates policies for reporting

### 005_create_get_email_by_username_function.sql
- Creates secure `get_email_by_username()` function
- Used for username-based login
- Only exposes user_id and email (no stats)
- Uses SECURITY DEFINER to bypass RLS for lookup

## Migration Order

The migrations must be run in numerical order (001 → 002 → 003 → 004 → 005) as they have dependencies:
- 001: Base profiles table
- 002: Leaderboard tables (references profiles via indexes)
- 003: View (depends on profiles table)
- 004: Question reports (independent)
- 005: Function (depends on profiles table)

## Production Schema Match

These migrations were created by extracting the exact schema from the production database (`mrxuawirygwcmxxexrlk`). They include:

✅ All tables with correct column types and defaults  
✅ All foreign key constraints  
✅ All indexes  
✅ All RLS policies  
✅ All views  
✅ All functions  
✅ All triggers  

## Backup

The previous migration files have been backed up to `migrations/backup/` directory.

## Usage

To apply these migrations to a new database (e.g., staging):

1. Run migrations in order (001 through 005)
2. Verify all tables, views, functions, and policies are created
3. Test RLS policies to ensure security is working correctly

## Notes

- All migrations use `IF NOT EXISTS` where appropriate to be idempotent
- RLS is enabled on all user-facing tables
- The `profiles` table includes all stats columns (no JSONB stats column)
- The `public_profile_data` view filters out users without usernames

