/**
 * Script to add existing test users (test1-test15) to the "palm ct" leaderboard
 *
 * Usage:
 *   npx tsx scripts/addTestUsersToLeaderboard.ts
 *   or: STAGING=true npx tsx scripts/addTestUsersToLeaderboard.ts (for staging)
 *
 * Note: If you hit rate limits, either:
 * 1. Wait a few minutes and try again, or
 * 2. Set EXPO_SUPABASE_SERVICE_ROLE_KEY environment variable to use service role key (bypasses RLS)
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.staging if STAGING=true, otherwise use default
if (process.env.STAGING === "true") {
  const envPath = resolve(process.cwd(), ".env.staging");
  dotenv.config({ path: envPath });
  console.log("📦 Loading staging environment from .env.staging\n");
} else {
  // Try to load .env.local or default .env
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
  dotenv.config(); // Fallback to .env
}

// Use environment variables, with fallback for local development
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Use service role key if available (bypasses RLS and rate limits)
const SUPABASE_SERVICE_ROLE_KEY = process.env.EXPO_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
);

async function addUsersToLeaderboard() {
  // If using service role key, no need to authenticate
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    // Sign in anonymously to query leaderboards (RLS requires auth)
    await supabase.auth.signOut();
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();

    if (authError || !authData.user) {
      console.error("Failed to authenticate:", authError);
      console.error(
        "\n💡 Tip: Set EXPO_SUPABASE_SERVICE_ROLE_KEY environment variable to bypass auth and rate limits"
      );
      return;
    }
  } else {
    console.log("Using service role key (bypasses RLS)\n");
  }

  console.log("Finding 'palm ct' leaderboard...\n");

  // Find the "palm ct" leaderboard using case-insensitive matching
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
    console.error("❌ Leaderboard 'palm ct' not found.\n");
    console.log("Available leaderboards:");
    const { data: allLeaderboards } = await supabase
      .from("private_leaderboards")
      .select("id, name, owner_id");
    if (allLeaderboards) {
      allLeaderboards.forEach((lb) =>
        console.log(`  - "${lb.name}" (ID: ${lb.id})`)
      );
    } else {
      console.log("  (none found)");
    }
    await supabase.auth.signOut();
    return;
  }

  const leaderboardId = leaderboards[0].id;
  const leaderboardName = leaderboards[0].name;
  console.log(
    `✓ Found leaderboard "${leaderboardName}" (ID: ${leaderboardId})\n`
  );

  // Get user IDs for test1-test15
  const usernames = Array.from({ length: 15 }, (_, i) => `test${i + 1}`);
  console.log(`Fetching profiles for: ${usernames.join(", ")}\n`);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, username")
    .in("username", usernames);

  if (profilesError) {
    console.error("Failed to fetch user profiles:", profilesError);
    await supabase.auth.signOut();
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.error("No profiles found for the specified usernames");
    await supabase.auth.signOut();
    return;
  }

  console.log(`✓ Found ${profiles.length} profiles:\n`);
  profiles.forEach((p) => console.log(`  - ${p.username} (${p.user_id})`));
  console.log();

  // Add users to leaderboard one by one
  console.log("Adding users to leaderboard...\n");
  let successCount = 0;
  let errorCount = 0;

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
      console.error(`  ❌ ${profile.username}: ${insertError.message}`);
      errorCount++;
    } else {
      console.log(`  ✓ Added ${profile.username}`);
      successCount++;
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`  Successfully added: ${successCount}`);
  if (errorCount > 0) {
    console.log(`  Failed: ${errorCount}`);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    await supabase.auth.signOut();
  }
}

addUsersToLeaderboard().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
