import { supabase } from "./supabaseClient";
import { getOrCreateDeviceId } from "./deviceId";
import { storageService } from "./storage";
import { UserProgress } from "../types";

export interface AuthProfile {
  userId: string;
  email: string | null;
  username: string | null;
}

export const USERNAME_REGEX = /^[A-Za-z0-9]{4,20}$/;

async function getLocalStats(): Promise<UserProgress | null> {
  return storageService.getUserProgress();
}

async function attachProfileToUser(
  userId: string,
  email: string | null,
  username: string
): Promise<string | null> {
  const deviceId = await getOrCreateDeviceId();
  const localStats = await getLocalStats();

  // Find existing profile for this device or user
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .or(`device_id.eq.${deviceId},user_id.eq.${userId}`)
    .limit(1)
    .maybeSingle();

  const stats = localStats ?? (existingProfile?.stats as UserProgress | null) ?? null;

  // Two-step approach: first ensure profile exists (without user_id if needed), then update with user_id
  // This avoids foreign key constraint violations if the user transaction hasn't committed yet
  
  // Step 1: Upsert profile without user_id first (using device_id as conflict target)
  const { data: profileData, error: upsertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: existingProfile?.id,
        device_id: deviceId,
        email: existingProfile?.email ?? email,
        username: existingProfile?.username ?? username,
        stats: stats ?? existingProfile?.stats,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "device_id" }
    )
    .select()
    .single();

  if (upsertError) {
    // Check for unique violation on username
    if (
      upsertError.code === "23505" ||
      (typeof upsertError.message === "string" &&
        upsertError.message.toLowerCase().includes("username"))
    ) {
      return "That username is already taken. Please choose another one.";
    }
    return upsertError.message ?? "Failed to create profile.";
  }

  const profileId = profileData?.id || existingProfile?.id;
  if (!profileId) {
    return "Failed to create or find profile.";
  }

  // Step 2: Now update the profile with user_id
  // Add a delay to ensure user transaction has committed, and retry if FK constraint fails
  let retries = 3;
  let lastError: any = null;
  
  while (retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { error } = await supabase
      .from("profiles")
      .update({
        user_id: userId,
        email,
        username,
        stats,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    
    if (!error) {
      // Success!
      break;
    }
    
    // Check if it's a foreign key constraint error
    if (
      error.code === "23503" ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("foreign key"))
    ) {
      lastError = error;
      retries--;
      if (retries === 0) {
        // Last retry failed - the user might not exist yet or there's a real issue
        return "Account is still being created. Please wait a moment and refresh.";
      }
      // Wait longer before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }
    
    // Some other error - return it
    lastError = error;
    break;
  }
  
  if (lastError) {
    // Check for unique violation on username
    if (
      lastError.code === "23505" ||
      (typeof lastError.message === "string" &&
        lastError.message.toLowerCase().includes("username"))
    ) {
      return "That username is already taken. Please choose another one.";
    }
    return lastError.message ?? "Failed to attach profile to user.";
  }

  // If we have stats from Supabase, sync them down to local storage so this device matches the account
  if (stats) {
    await storageService.saveUserProgress(stats);
  }

  return null;
}

export async function signUpWithEmailUsernamePassword(
  email: string,
  username: string,
  password: string
): Promise<{ profile: AuthProfile | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    // Parse Supabase auth errors to be more user-friendly
    let errorMessage = error?.message ?? "Sign up failed";
    
    // Check for common Supabase error patterns
    if (error?.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes("user already registered") || msg.includes("email already registered") || msg.includes("already registered")) {
        errorMessage = "This email is already registered";
      } else if (msg.includes("password") && (msg.includes("8") || msg.includes("length"))) {
        errorMessage = "Password must be at least 8 characters";
      } else if (msg.includes("invalid email")) {
        errorMessage = "Please enter a valid email address";
      }
    }
    
    return { profile: null, error: errorMessage };
  }

  const attachError = await attachProfileToUser(data.user.id, email, username);
  if (attachError) {
    return { profile: null, error: attachError };
  }

  return {
    profile: {
      userId: data.user.id,
      email: data.user.email,
      username,
    },
    error: null,
  };
}

async function signInWithEmail(
  email: string,
  password: string
): Promise<{ profile: AuthProfile | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { profile: null, error: error?.message ?? "Login failed" };
  }

  // Fetch username & stats from profile and sync to this device
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileRow?.stats) {
    await storageService.saveUserProgress(profileRow.stats as UserProgress);
  }

  const username = (profileRow?.username as string | null) ?? null;
  const emailFromProfile = (profileRow?.email as string | null) ?? data.user.email;

  // Ensure this device's profile is attached to the user
  if (username) {
    await attachProfileToUser(data.user.id, emailFromProfile, username);
  }

  return {
    profile: {
      userId: data.user.id,
      email: emailFromProfile,
      username,
    },
    error: null,
  };
}

export async function loginWithEmailOrUsername(
  identifier: string,
  password: string
): Promise<{ profile: AuthProfile | null; error: string | null }> {
  // Simple heuristic: if it contains '@', treat as email
  const looksLikeEmail = identifier.includes("@");

  if (looksLikeEmail) {
    return signInWithEmail(identifier, password);
  }

  // Otherwise, treat as username: look up the profile to get email
  const { data: profileRow, error: lookupError } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", identifier)
    .maybeSingle();

  if (lookupError || !profileRow?.email) {
    return { profile: null, error: "Username not found" };
  }

  return signInWithEmail(profileRow.email as string, password);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function updateUsername(
  userId: string,
  newUsername: string
): Promise<{ success: boolean; error: string | null }> {
  // Validate username
  if (!USERNAME_REGEX.test(newUsername.trim())) {
    return {
      success: false,
      error: "Username must be 4–20 characters and use only letters and numbers",
    };
  }

  // Check if username is already taken by another user
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", newUsername.trim())
    .maybeSingle();

  if (existingProfile && existingProfile.user_id !== userId) {
    return {
      success: false,
      error: "This username is already taken",
    };
  }

  // Update username in profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ username: newUsername.trim() })
    .eq("user_id", userId);

  if (error) {
    if (
      error.code === "23505" ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("username"))
    ) {
      return {
        success: false,
        error: "This username is already taken",
      };
    }
    return {
      success: false,
      error: error.message ?? "Failed to update username",
    };
  }

  return { success: true, error: null };
}

export async function updateEmail(
  newEmail: string
): Promise<{ success: boolean; error: string | null }> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail.trim())) {
    return {
      success: false,
      error: "Please enter a valid email address",
    };
  }

  // Update email in Supabase Auth (this may trigger email confirmation)
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail.trim(),
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return {
        success: false,
        error: "This email is already registered",
      };
    }
    return {
      success: false,
      error: error.message ?? "Failed to update email",
    };
  }

  // Also update email in profiles table
  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ email: newEmail.trim() })
      .eq("user_id", data.user.id);

    if (profileError) {
      // Auth update succeeded but profile update failed - log but don't fail
      console.warn("Failed to update email in profiles table:", profileError);
    }
  }

  return { success: true, error: null };
}


