import { supabase } from "./supabaseClient";
import { UserPreferences } from "../types";

/**
 * Get user preferences, returning defaults if none exist
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }

  if (!data) {
    // Return default preferences
    return {
      userId,
      blockLeaderboardInvites: false,
      hideFromGlobalLeaderboard: false,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    userId: data.user_id,
    blockLeaderboardInvites: data.block_leaderboard_invites ?? false,
    hideFromGlobalLeaderboard: data.hide_from_global_leaderboard ?? false,
    updatedAt: data.updated_at,
  };
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<Pick<UserPreferences, "blockLeaderboardInvites" | "hideFromGlobalLeaderboard">>
): Promise<{ success: boolean; error: string | null }> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (preferences.blockLeaderboardInvites !== undefined) {
    updateData.block_leaderboard_invites = preferences.blockLeaderboardInvites;
  }

  if (preferences.hideFromGlobalLeaderboard !== undefined) {
    updateData.hide_from_global_leaderboard = preferences.hideFromGlobalLeaderboard;
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        ...updateData,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Error updating user preferences:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Check if user blocks leaderboard invites
 */
export async function checkIfUserBlocksInvites(
  userId: string
): Promise<boolean> {
  const preferences = await getUserPreferences(userId);
  return preferences?.blockLeaderboardInvites ?? false;
}

/**
 * Check if user hides from global leaderboard
 */
export async function checkIfUserHidesFromGlobal(
  userId: string
): Promise<boolean> {
  const preferences = await getUserPreferences(userId);
  return preferences?.hideFromGlobalLeaderboard ?? false;
}

