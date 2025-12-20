import { supabase } from "./supabaseClient";
import {
  LeaderboardEntry,
  PrivateLeaderboard,
  LeaderboardMember,
} from "../types";
import {
  checkIfUserBlocksInvites,
  checkIfUserHidesFromGlobal,
} from "./preferences";

/**
 * Get global leaderboard ranked by XP
 */
export async function getGlobalLeaderboardByXP(
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  // Get all users who haven't hidden from global leaderboard
  const { data: hiddenUsers } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("hide_from_global_leaderboard", true);

  const hiddenUserIds = hiddenUsers?.map((u) => u.user_id) || [];

  // Build query using normalized columns for efficient database ordering
  // Use secure view that only exposes public data (no email)
  // Fetch extra rows to account for hidden users that will be filtered out
  const fetchLimit = hiddenUserIds.length > 0 ? limit * 2 : limit;
  let query = supabase
    .from("public_profile_data")
    .select("user_id, username, total_xp, day_streak")
    .order("total_xp", { ascending: false })
    .range(offset, offset + fetchLimit - 1);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching global XP leaderboard:", error);
    return [];
  }

  if (!data) return [];

  // Filter out hidden users (small result set, so client-side filtering is acceptable)
  const visibleData = data.filter(
    (profile) => !hiddenUserIds.includes(profile.user_id)
  );

  // Transform and add ranks
  return visibleData.map((profile, index) => ({
    userId: profile.user_id,
    username: profile.username,
    totalXP: profile.total_xp || 0,
    dayStreak: profile.day_streak || 0,
    rank: offset + index + 1,
  }));
}

/**
 * Get global leaderboard ranked by Days Streak
 */
export async function getGlobalLeaderboardByStreak(
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  // Get all users who haven't hidden from global leaderboard
  const { data: hiddenUsers } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("hide_from_global_leaderboard", true);

  const hiddenUserIds = hiddenUsers?.map((u) => u.user_id) || [];

  // Build query using normalized columns for efficient database ordering
  // Use secure view that only exposes public data (no email)
  // Fetch extra rows to account for hidden users that will be filtered out
  const fetchLimit = hiddenUserIds.length > 0 ? limit * 2 : limit;
  let query = supabase
    .from("public_profile_data")
    .select("user_id, username, total_xp, day_streak")
    .order("day_streak", { ascending: false })
    .range(offset, offset + fetchLimit - 1);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching global streak leaderboard:", error);
    return [];
  }

  if (!data) return [];

  // Filter out hidden users (small result set, so client-side filtering is acceptable)
  const visibleData = data.filter(
    (profile) => !hiddenUserIds.includes(profile.user_id)
  );

  // Transform and add ranks
  return visibleData.map((profile, index) => ({
    userId: profile.user_id,
    username: profile.username,
    totalXP: profile.total_xp || 0,
    dayStreak: profile.day_streak || 0,
    rank: offset + index + 1,
  }));
}

/**
 * Get user's rank and surrounding entries in global XP leaderboard
 */
export async function getUserGlobalRankByXP(
  userId: string
): Promise<{
  rank: number | null;
  entries: LeaderboardEntry[];
} | null> {
  const isHidden = await checkIfUserHidesFromGlobal(userId);
  if (isHidden) {
    return { rank: null, entries: [] };
  }

  // Get all entries
  const allEntries = await getGlobalLeaderboardByXP(10000, 0);

  // Find user's position
  const userIndex = allEntries.findIndex((e) => e.userId === userId);
  if (userIndex === -1) {
    return { rank: null, entries: [] };
  }

  const rank = userIndex + 1;

  // Get 2 entries before and 2 after (5 total with user in middle)
  const start = Math.max(0, userIndex - 2);
  const end = Math.min(allEntries.length, userIndex + 3);
  const entries = allEntries.slice(start, end);

  return { rank, entries };
}

/**
 * Get user's rank and surrounding entries in global streak leaderboard
 */
export async function getUserGlobalRankByStreak(
  userId: string
): Promise<{
  rank: number | null;
  entries: LeaderboardEntry[];
} | null> {
  const isHidden = await checkIfUserHidesFromGlobal(userId);
  if (isHidden) {
    return { rank: null, entries: [] };
  }

  // Get all entries
  const allEntries = await getGlobalLeaderboardByStreak(10000, 0);

  // Find user's position
  const userIndex = allEntries.findIndex((e) => e.userId === userId);
  if (userIndex === -1) {
    return { rank: null, entries: [] };
  }

  const rank = userIndex + 1;

  // Get 2 entries before and 2 after (5 total with user in middle)
  const start = Math.max(0, userIndex - 2);
  const end = Math.min(allEntries.length, userIndex + 3);
  const entries = allEntries.slice(start, end);

  return { rank, entries };
}

/**
 * Create a private leaderboard
 */
export async function createPrivateLeaderboard(
  name: string,
  description: string | null,
  ownerId: string
): Promise<{ leaderboard: PrivateLeaderboard | null; error: string | null }> {
  if (!name || name.trim().length === 0) {
    return { leaderboard: null, error: "Leaderboard name is required" };
  }

  if (name.length > 100) {
    return { leaderboard: null, error: "Leaderboard name is too long" };
  }

  // Create leaderboard
  const { data: leaderboard, error: createError } = await supabase
    .from("private_leaderboards")
    .insert({
      owner_id: ownerId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (createError || !leaderboard) {
    console.error("Error creating leaderboard:", createError);
    return {
      leaderboard: null,
      error: createError?.message || "Failed to create leaderboard",
    };
  }

  // Add owner as first member
  const { error: memberError } = await supabase
    .from("leaderboard_members")
    .insert({
      leaderboard_id: leaderboard.id,
      user_id: ownerId,
    });

  if (memberError) {
    // Rollback: delete the leaderboard
    await supabase.from("private_leaderboards").delete().eq("id", leaderboard.id);
    return {
      leaderboard: null,
      error: "Failed to add owner as member",
    };
  }

  return {
    leaderboard: {
      id: leaderboard.id,
      ownerId: leaderboard.owner_id,
      name: leaderboard.name,
      description: leaderboard.description,
      createdAt: leaderboard.created_at,
      updatedAt: leaderboard.updated_at,
      maxMembers: leaderboard.max_members,
      memberCount: 1,
    },
    error: null,
  };
}

/**
 * Get all private leaderboards for a user
 */
export async function getPrivateLeaderboardsForUser(
  userId: string
): Promise<PrivateLeaderboard[]> {
  const { data, error } = await supabase
    .from("leaderboard_members")
    .select(
      `
      leaderboard_id,
      private_leaderboards (
        id,
        owner_id,
        name,
        description,
        created_at,
        updated_at,
        max_members
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user leaderboards:", error);
    return [];
  }

  if (!data) return [];

  // Get member counts for each leaderboard
  const leaderboardIds = data.map((d) => d.leaderboard_id);
  const { data: memberCounts } = await supabase
    .from("leaderboard_members")
    .select("leaderboard_id")
    .in("leaderboard_id", leaderboardIds);

  const countsMap = new Map<string, number>();
  memberCounts?.forEach((m) => {
    countsMap.set(m.leaderboard_id, (countsMap.get(m.leaderboard_id) || 0) + 1);
  });

  return data
    .map((item) => {
      const lb = item.private_leaderboards as any;
      if (!lb) return null;
      return {
        id: lb.id,
        ownerId: lb.owner_id,
        name: lb.name,
        description: lb.description,
        createdAt: lb.created_at,
        updatedAt: lb.updated_at,
        maxMembers: lb.max_members,
        memberCount: countsMap.get(lb.id) || 0,
      };
    })
    .filter((lb): lb is PrivateLeaderboard => lb !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Get members of a private leaderboard with stats, sorted by XP or Streak
 */
export async function getPrivateLeaderboardMembers(
  leaderboardId: string,
  sortBy: "xp" | "streak" = "xp"
): Promise<LeaderboardMember[]> {
  // First get the member user IDs
  const { data: members, error: membersError } = await supabase
    .from("leaderboard_members")
    .select("user_id, joined_at")
    .eq("leaderboard_id", leaderboardId);

  if (membersError || !members) {
    console.error("Error fetching leaderboard members:", membersError);
    return [];
  }

  if (members.length === 0) {
    return [];
  }

  // Then get the profiles for those users (using secure view with normalized columns)
  const userIds = members.map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("public_profile_data")
    .select("user_id, username, total_xp, day_streak")
    .in("user_id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  if (!profiles) return [];

  // Create a map of user_id to profile for quick lookup
  const profileMap = new Map(
    profiles.map((p) => [p.user_id, p])
  );

  // Transform and sort
  const leaderboardMembers: LeaderboardMember[] = members
    .map((member) => {
      const profile = profileMap.get(member.user_id);
      if (!profile) return null;
      return {
        userId: member.user_id,
        username: profile.username,
        totalXP: profile.total_xp || 0,
        dayStreak: profile.day_streak || 0,
        rank: 0, // Will be set after sorting
        joinedAt: member.joined_at,
      };
    })
    .filter((m): m is LeaderboardMember => m !== null);

  // Sort by XP or Streak
  leaderboardMembers.sort((a, b) => {
    if (sortBy === "xp") {
      return b.totalXP - a.totalXP;
    } else {
      return b.dayStreak - a.dayStreak;
    }
  });

  // Assign ranks
  leaderboardMembers.forEach((member, index) => {
    member.rank = index + 1;
  });

  return leaderboardMembers;
}

/**
 * Get user's rank in a private leaderboard
 */
export async function getUserRankInPrivateLeaderboard(
  leaderboardId: string,
  userId: string,
  sortBy: "xp" | "streak" = "xp"
): Promise<{
  rank: number | null;
  entries: LeaderboardMember[];
} | null> {
  const allMembers = await getPrivateLeaderboardMembers(leaderboardId, sortBy);

  const userIndex = allMembers.findIndex((m) => m.userId === userId);
  if (userIndex === -1) {
    return { rank: null, entries: [] };
  }

  const rank = userIndex + 1;

  // Get 2 entries before and 2 after (5 total with user in middle)
  const start = Math.max(0, userIndex - 2);
  const end = Math.min(allMembers.length, userIndex + 3);
  const entries = allMembers.slice(start, end);

  return { rank, entries };
}

/**
 * Add a member to a private leaderboard
 */
export async function addMemberToLeaderboard(
  leaderboardId: string,
  username: string,
  addedByUserId: string
): Promise<{ success: boolean; error: string | null }> {
  // Verify leaderboard exists and user is a member
  const { data: leaderboard, error: lbError } = await supabase
    .from("private_leaderboards")
    .select("id, max_members")
    .eq("id", leaderboardId)
    .single();

  if (lbError || !leaderboard) {
    return { success: false, error: "Leaderboard not found" };
  }

  // Check if addedByUserId is a member
  const { data: isMember } = await supabase
    .from("leaderboard_members")
    .select("user_id")
    .eq("leaderboard_id", leaderboardId)
    .eq("user_id", addedByUserId)
    .maybeSingle();

  if (!isMember) {
    return { success: false, error: "You must be a member to add others" };
  }

  // Find user by username (using secure view)
  const { data: profile, error: profileError } = await supabase
    .from("public_profile_data")
    .select("user_id, username")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) {
    return { success: false, error: "User not found" };
  }

  const userId = profile.user_id;

  // Check if user is authenticated (has username)
  if (!profile.username) {
    return { success: false, error: "Cannot add anonymous users" };
  }

  // Check if user blocks invites
  const blocksInvites = await checkIfUserBlocksInvites(userId);
  if (blocksInvites) {
    return { success: false, error: "This user has blocked leaderboard invites" };
  }

  // Check member count
  const { count } = await supabase
    .from("leaderboard_members")
    .select("*", { count: "exact", head: true })
    .eq("leaderboard_id", leaderboardId);

  if ((count || 0) >= leaderboard.max_members) {
    return { success: false, error: "Leaderboard is full (max 50 members)" };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("leaderboard_members")
    .select("user_id")
    .eq("leaderboard_id", leaderboardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    return { success: false, error: "User is already a member" };
  }

  // Add member
  const { error: addError } = await supabase.from("leaderboard_members").insert({
    leaderboard_id: leaderboardId,
    user_id: userId,
  });

  if (addError) {
    console.error("Error adding member:", addError);
    return { success: false, error: addError.message };
  }

  // Note: Push notifications deferred - see Phase 6 in TODO_LEADERBOARD.md

  return { success: true, error: null };
}

/**
 * Remove a member from a private leaderboard (owner only)
 */
export async function removeMemberFromLeaderboard(
  leaderboardId: string,
  userId: string,
  removedByUserId: string
): Promise<{ success: boolean; error: string | null }> {
  // Verify removedByUserId is owner
  const { data: leaderboard, error: lbError } = await supabase
    .from("private_leaderboards")
    .select("owner_id")
    .eq("id", leaderboardId)
    .single();

  if (lbError || !leaderboard) {
    return { success: false, error: "Leaderboard not found" };
  }

  if (leaderboard.owner_id !== removedByUserId) {
    return { success: false, error: "Only the owner can remove members" };
  }

  // Prevent removing owner
  if (userId === leaderboard.owner_id) {
    return {
      success: false,
      error: "Cannot remove owner. Transfer ownership first.",
    };
  }

  // Remove member
  const { error: removeError } = await supabase
    .from("leaderboard_members")
    .delete()
    .eq("leaderboard_id", leaderboardId)
    .eq("user_id", userId);

  if (removeError) {
    console.error("Error removing member:", removeError);
    return { success: false, error: removeError.message };
  }

  // Note: Push notifications deferred - see Phase 6 in TODO_LEADERBOARD.md

  return { success: true, error: null };
}

/**
 * Transfer ownership of a private leaderboard
 */
export async function transferOwnership(
  leaderboardId: string,
  newOwnerId: string,
  currentOwnerId: string
): Promise<{ success: boolean; error: string | null }> {
  // Verify currentOwnerId is owner
  const { data: leaderboard, error: lbError } = await supabase
    .from("private_leaderboards")
    .select("owner_id")
    .eq("id", leaderboardId)
    .single();

  if (lbError || !leaderboard) {
    return { success: false, error: "Leaderboard not found" };
  }

  if (leaderboard.owner_id !== currentOwnerId) {
    return { success: false, error: "You are not the owner" };
  }

  // Verify newOwnerId is a member
  const { data: isMember } = await supabase
    .from("leaderboard_members")
    .select("user_id")
    .eq("leaderboard_id", leaderboardId)
    .eq("user_id", newOwnerId)
    .maybeSingle();

  if (!isMember) {
    return { success: false, error: "New owner must be an existing member" };
  }

  // Transfer ownership
  const { error: updateError } = await supabase
    .from("private_leaderboards")
    .update({ owner_id: newOwnerId })
    .eq("id", leaderboardId);

  if (updateError) {
    console.error("Error transferring ownership:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
}

/**
 * Delete a private leaderboard (owner only)
 */
export async function deletePrivateLeaderboard(
  leaderboardId: string,
  ownerId: string
): Promise<{ success: boolean; error: string | null }> {
  // Verify ownerId is owner
  const { data: leaderboard, error: lbError } = await supabase
    .from("private_leaderboards")
    .select("owner_id")
    .eq("id", leaderboardId)
    .single();

  if (lbError || !leaderboard) {
    return { success: false, error: "Leaderboard not found" };
  }

  if (leaderboard.owner_id !== ownerId) {
    return { success: false, error: "Only the owner can delete the leaderboard" };
  }

  // Delete leaderboard (cascade will delete members)
  const { error: deleteError } = await supabase
    .from("private_leaderboards")
    .delete()
    .eq("id", leaderboardId);

  if (deleteError) {
    console.error("Error deleting leaderboard:", deleteError);
    return { success: false, error: deleteError.message };
  }

  return { success: true, error: null };
}

