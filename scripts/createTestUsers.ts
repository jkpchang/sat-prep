/**
 * Script to create 20 fake test users with random stats
 * and add test1-test15 to the "palm ct" private leaderboard
 * 
 * Usage:
 *   npm run create-test-users
 *   or: npx tsx scripts/createTestUsers.ts
 * 
 * Note: If you encounter RLS permission errors when adding users to the leaderboard,
 * you can either:
 * 1. Sign in as the leaderboard owner before running this script, or
 * 2. Replace SUPABASE_ANON_KEY with your service role key (for admin access)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mrxuawirygwcmxxexrlk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RYjzhGnXjLIkPXw83aY-rA_FNU_3Dt1";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestUser {
  username: string;
  userId: string;
  totalXP: number;
  dayStreak: number;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create a single test user with anonymous auth
 */
async function createTestUser(username: string): Promise<TestUser | null> {
  try {
    // Sign out any existing session first
    await supabase.auth.signOut();

    // Create anonymous auth user
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

    if (authError || !authData.user) {
      console.error(`Failed to create auth user for ${username}:`, authError);
      return null;
    }

    const userId = authData.user.id;

    // Generate random stats
    const totalXP = randomInt(10, 1000);
    const dayStreak = randomInt(1, 30);

    // Create/update profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        username,
        total_xp: totalXP,
        day_streak: dayStreak,
        questions_answered: 0,
        correct_answers: 0,
        answer_streak: 0,
        achievements: [],
        answered_question_ids: [],
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Sign out after creating the profile
    await supabase.auth.signOut();

    if (profileError) {
      console.error(`Failed to create profile for ${username}:`, profileError);
      // Still return the user info even if profile creation failed
      return { username, userId, totalXP, dayStreak };
    }

    console.log(`✓ Created ${username} (${userId}) - XP: ${totalXP}, Streak: ${dayStreak}`);
    return { username, userId, totalXP, dayStreak };
  } catch (error) {
    console.error(`Error creating user ${username}:`, error);
    // Make sure we sign out even on error
    await supabase.auth.signOut().catch(() => {});
    return null;
  }
}

/**
 * Add users to the "palm ct" private leaderboard
 * Note: This requires RLS policies to allow the operation.
 * We need to be authenticated to query private_leaderboards due to RLS.
 */
async function addUsersToLeaderboard(usernames: string[]): Promise<void> {
  // First, sign in as an anonymous user so we can query the leaderboard
  // (RLS requires authentication to view leaderboards)
  await supabase.auth.signOut();
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  
  if (authError || !authData.user) {
    console.error("Failed to authenticate for leaderboard lookup:", authError);
    return;
  }

  // Find the "palm ct" leaderboard using case-insensitive matching
  // Try exact match first, then case-insensitive
  let { data: leaderboards, error: leaderboardError } = await supabase
    .from("private_leaderboards")
    .select("id, owner_id, name")
    .ilike("name", "palm ct")
    .limit(1);

  // If no results, try exact match
  if (!leaderboardError && (!leaderboards || leaderboards.length === 0)) {
    const { data: exactMatch, error: exactError } = await supabase
      .from("private_leaderboards")
      .select("id, owner_id, name")
      .eq("name", "palm ct")
      .limit(1);
    
    if (!exactError && exactMatch && exactMatch.length > 0) {
      leaderboards = exactMatch;
      leaderboardError = null;
    }
  }

  if (leaderboardError) {
    console.error("Error querying leaderboard:", leaderboardError);
    await supabase.auth.signOut();
    return;
  }

  if (!leaderboards || leaderboards.length === 0) {
    console.error("❌ Leaderboard 'palm ct' not found. Please create it first.");
    console.log("Available leaderboards:");
    // List all leaderboards for debugging
    const { data: allLeaderboards } = await supabase
      .from("private_leaderboards")
      .select("id, name, owner_id");
    if (allLeaderboards) {
      allLeaderboards.forEach(lb => console.log(`  - "${lb.name}" (ID: ${lb.id})`));
    }
    await supabase.auth.signOut();
    return;
  }

  const leaderboardId = leaderboards[0].id;
  const ownerId = leaderboards[0].owner_id;

  console.log(`Found leaderboard "palm ct" (ID: ${leaderboardId}, Owner: ${ownerId})`);

  // Get user IDs for the test users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id")
    .in("username", usernames);

  if (profilesError || !profiles) {
    console.error("Failed to fetch user profiles:", profilesError);
    return;
  }

  if (profiles.length === 0) {
    console.error("No profiles found for the specified usernames");
    return;
  }

  console.log(`Found ${profiles.length} profiles to add to leaderboard`);

  // Add users to leaderboard one by one to handle potential RLS issues
  let successCount = 0;
  for (const profile of profiles) {
    const { error: insertError } = await supabase
      .from("leaderboard_members")
      .upsert(
        {
          leaderboard_id: leaderboardId,
          user_id: profile.user_id,
          joined_at: new Date().toISOString(),
        },
        { onConflict: "leaderboard_id,user_id" }
      );

    if (insertError) {
      console.error(
        `Failed to add user ${profile.user_id} to leaderboard:`,
        insertError.message
      );
    } else {
      successCount++;
    }
  }

  if (successCount > 0) {
    console.log(`✓ Added ${successCount} out of ${profiles.length} users to "palm ct" leaderboard`);
    if (successCount < profiles.length) {
      console.log("⚠️  Some users could not be added due to RLS policies.");
      console.log("   Consider using a service role key or signing in as the leaderboard owner.");
    }
  } else {
    console.error("❌ Failed to add any users to leaderboard. Check RLS policies.");
  }

  // Sign out after we're done
  await supabase.auth.signOut();
}

/**
 * Main function
 */
async function main() {
  console.log("Creating 20 test users...\n");

  const usernames = Array.from({ length: 20 }, (_, i) => `test${i + 1}`);
  const createdUsers: TestUser[] = [];

  // Create users one by one
  for (const username of usernames) {
    const user = await createTestUser(username);
    if (user) {
      createdUsers.push(user);
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n✓ Created ${createdUsers.length} out of ${usernames.length} users\n`);

  // Add test1-test15 to the "palm ct" leaderboard
  console.log("Adding test1-test15 to 'palm ct' leaderboard...\n");
  const leaderboardUsernames = usernames.slice(0, 15); // test1 to test15
  await addUsersToLeaderboard(leaderboardUsernames);

  console.log("\n✅ Done!");
  console.log("\nCreated users:");
  createdUsers.forEach((user) => {
    console.log(`  ${user.username}: XP=${user.totalXP}, Streak=${user.dayStreak}`);
  });
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

