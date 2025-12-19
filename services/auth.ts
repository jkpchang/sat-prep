import { supabase } from "./supabaseClient";
import { storageService } from "./storage";
import { UserProgress } from "../types";

export interface AuthProfile {
  userId: string;
  email: string | null; // From auth.users (confirmed/active email)
  profileEmail: string | null; // From profiles table (may be pending confirmation)
  username: string | null;
}

export const USERNAME_REGEX = /^[A-Za-z0-9]{4,20}$/;

async function getLocalStats(): Promise<UserProgress | null> {
  return storageService.getUserProgress();
}

/**
 * Ensures the user has an anonymous auth session.
 * If already authenticated, returns the existing user ID.
 * Otherwise, signs in anonymously and returns the new user ID.
 */
export async function ensureAnonymousAuth(): Promise<{ userId: string | null; error: string | null }> {
  // Check if already authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    return { userId: session.user.id, error: null };
  }
  
  // Sign in anonymously
  // Note: Anonymous authentication must be enabled in Supabase Dashboard:
  // Authentication > Providers > Anonymous > Enable
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error || !data.user) {
    console.error("Failed to create anonymous auth:", error);
    return { userId: null, error: error?.message ?? "Failed to create anonymous session" };
  }
  
  console.log("Anonymous user created:", data.user.id);
  return { userId: data.user.id, error: null };
}

async function attachProfileToUser(
  userId: string,
  email: string | null,
  username: string
): Promise<string | null> {
  const localStats = await getLocalStats();

  // Find existing profile for this user
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const stats = localStats ?? (existingProfile?.stats as UserProgress | null) ?? null;

  // Upsert profile with user_id (RLS will ensure user can only access their own profile)
  // Note: email is stored in profiles ONLY for username->email lookup during login
  // For display, always read from auth.users.email to avoid sync issues
  const { error } = await supabase.from("profiles").upsert(
    {
      id: existingProfile?.id,
      user_id: userId,
      email, // Stored for username lookup only
      username,
      stats,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    // Check for unique violation on username
    if (
      error.code === "23505" ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("username"))
    ) {
      return "That username is already taken. Please choose another one.";
    }
    return error.message ?? "Failed to attach profile to user.";
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
  // Get current session (might be anonymous)
  const { data: { session } } = await supabase.auth.getSession();
  const currentUser = session?.user;
  
  if (currentUser && !currentUser.email) {
    // Upgrade anonymous user by adding email and password
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
    });
    
    if (error || !data.user) {
      // Parse Supabase auth errors to be more user-friendly
      let errorMessage = error?.message ?? "Sign up failed";
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          errorMessage = "This email is already registered";
        } else if (msg.includes("password") && (msg.includes("8") || msg.includes("length"))) {
          errorMessage = "Password must be at least 8 characters";
        } else if (msg.includes("invalid email")) {
          errorMessage = "Please enter a valid email address";
        }
      }
      
      return { profile: null, error: errorMessage };
    }
    
    // Wait a moment for session to be established, then verify
    await new Promise(resolve => setTimeout(resolve, 100));
    const { data: { session: newSession } } = await supabase.auth.getSession();
    if (!newSession) {
      return { profile: null, error: "Failed to establish session after signup" };
    }
    
    // Get the updated user to verify email was set
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    if (!updatedUser || !updatedUser.email) {
      console.warn("User email was not set after updateUser");
    }
    
    // Attach profile to the upgraded user
    const attachError = await attachProfileToUser(data.user.id, email, username);
    if (attachError) {
      return { profile: null, error: attachError };
    }
    
        return {
          profile: {
            userId: data.user.id,
            email: updatedUser?.email ?? data.user.email ?? email, // Confirmed email from auth.users
            profileEmail: email, // Email in profiles (same as confirmed for new signups)
            username,
          },
          error: null,
        };
  } else {
    // No anonymous user, create new one
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      // Parse Supabase auth errors to be more user-friendly
      let errorMessage = error?.message ?? "Sign up failed";
      
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

    // Wait a moment for session to be established, then verify
    await new Promise(resolve => setTimeout(resolve, 100));
    const { data: { session: newSession } } = await supabase.auth.getSession();
    if (!newSession) {
      return { profile: null, error: "Failed to establish session after signup" };
    }
    
    const attachError = await attachProfileToUser(data.user.id, email, username);
    if (attachError) {
      return { profile: null, error: attachError };
    }

        return {
          profile: {
            userId: data.user.id,
            email: data.user.email, // Confirmed email from auth.users
            profileEmail: email, // Email in profiles (same as confirmed for new signups)
            username,
          },
          error: null,
        };
  }
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

  // Ensure this device's profile is attached to the user
  if (username) {
    await attachProfileToUser(data.user.id, data.user.email, username);
  }

      // Get profileEmail from profiles table
      const profileEmail = (profileRow?.email as string | null) ?? null;
      
      return {
        profile: {
          userId: data.user.id,
          email: data.user.email, // Confirmed email from auth.users
          profileEmail: profileEmail, // Email from profiles (may differ if pending confirmation)
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
  // Use secure database function that only returns user_id and email (not stats or other sensitive data)
  const { data: profileRow, error: lookupError } = await supabase.rpc(
    "get_email_by_username",
    { username_to_lookup: identifier }
  );

  if (lookupError || !profileRow || profileRow.length === 0 || !profileRow[0]?.email) {
    return { profile: null, error: "Username not found" };
  }

  return signInWithEmail(profileRow[0].email as string, password);
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

  // Update email in Supabase Auth
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

  // Update profiles.email for username lookup
  // Note: profiles.email is stored for username->email lookup during login
  // auth.users.email is the source of truth for display
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


