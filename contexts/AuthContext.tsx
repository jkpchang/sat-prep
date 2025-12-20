import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../services/supabaseClient";
import {
  signUpWithEmailUsernamePassword,
  loginWithEmailOrUsername,
  logout as authLogout,
  updateUsername,
  updateEmail,
  ensureAnonymousAuth,
  AuthProfile,
} from "../services/auth";
import { storageService } from "../services/storage";
import { gamificationService } from "../services/gamification";
import { UserProgress } from "../types";

interface AuthContextType {
  authProfile: AuthProfile | null;
  loading: boolean;
  signUp: (email: string, username: string, password: string) => Promise<{ error: string | null }>;
  login: (identifier: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateUserUsername: (newUsername: string) => Promise<{ success: boolean; error: string | null }>;
  updateUserEmail: (newEmail: string) => Promise<{ success: boolean; error: string | null }>;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Loads auth state from session and syncs progress stats if user is logged in
   */
  const loadAuthState = async () => {
    try {
      // Ensure anonymous auth is set up (won't create if session exists)
      await ensureAnonymousAuth();

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch profile to get username and profileEmail
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("username, email, total_xp, day_streak, questions_answered, correct_answers, answer_streak, last_question_date, questions_answered_today, last_valid_streak_date, achievements, answered_question_ids")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const authEmail = session.user.email; // From auth.users (confirmed/active)
        const profileEmail = (profileRow?.email as string | null) ?? null; // From profiles (may differ if email change is pending confirmation)

        const profile: AuthProfile = {
          userId: session.user.id,
          email: authEmail, // Confirmed/active email from auth.users
          profileEmail: profileEmail, // Email from profiles (may be pending confirmation)
          username: (profileRow?.username as string | null) ?? null,
        };

        setAuthProfile(profile);

        // Sync progress stats from Supabase to local storage
        // Database is the source of truth for authenticated users
        if (profileRow) {
          const reconstructedStats: UserProgress = {
            totalXP: profileRow.total_xp ?? 0,
            dayStreak: profileRow.day_streak ?? 0,
            questionsAnswered: profileRow.questions_answered ?? 0,
            correctAnswers: profileRow.correct_answers ?? 0,
            answerStreak: profileRow.answer_streak ?? 0,
            lastQuestionDate: profileRow.last_question_date ?? null,
            questionsAnsweredToday: profileRow.questions_answered_today ?? 0,
            lastValidStreakDate: profileRow.last_valid_streak_date ?? null,
            achievements: profileRow.achievements ?? [],
            answeredQuestionIds: profileRow.answered_question_ids ?? [],
          };
          await storageService.saveUserProgress(reconstructedStats);
        }
        // Always initialize gamification service (will load from local storage, which may have been synced above)
        await gamificationService.initialize();
      } else {
        setAuthProfile(null);
        // Initialize gamification service for anonymous users too
        await gamificationService.initialize();
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
      setAuthProfile(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh auth state (useful after profile updates)
   */
  const refreshAuthState = async () => {
    await loadAuthState();
  };

  /**
   * Sign up with email, username, and password
   */
  const signUp = async (
    email: string,
    username: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { profile, error } = await signUpWithEmailUsernamePassword(
      email,
      username,
      password
    );

    if (error || !profile) {
      return { error: error ?? "Sign up failed" };
    }

    // Update auth state after successful signup
    await loadAuthState();

    // Reload gamification progress from local storage that may have been updated
    await gamificationService.initialize();

    return { error: null };
  };

  /**
   * Login with email or username and password
   */
  const login = async (
    identifier: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { profile, error } = await loginWithEmailOrUsername(identifier, password);

    if (error || !profile) {
      return { error: error ?? "Login failed" };
    }

    // Update auth state after successful login
    await loadAuthState();

    // Reload gamification progress from local storage that may have been updated
    await gamificationService.initialize();

    return { error: null };
  };

  /**
   * Logout current user
   */
  const logout = async (): Promise<void> => {
    await authLogout();
    setAuthProfile(null);

    // After logout, ensure anonymous auth is set up
    await ensureAnonymousAuth();

    // Reload auth state to show guest/anonymous state
    await loadAuthState();
  };

  /**
   * Update username
   */
  const updateUserUsername = async (
    newUsername: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!authProfile) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await updateUsername(authProfile.userId, newUsername);

    if (result.success) {
      // Refresh auth state to get updated username
      await refreshAuthState();
    }

    return result;
  };

  /**
   * Update email
   */
  const updateUserEmail = async (
    newEmail: string
  ): Promise<{ success: boolean; error: string | null }> => {
    const result = await updateEmail(newEmail);

    if (result.success) {
      // Refresh auth state to get updated email
      await refreshAuthState();
    }

    return result;
  };

  // Load auth state on mount and listen for auth changes
  useEffect(() => {
    // Initial load
    loadAuthState();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Reload profile when auth state changes
        loadAuthState();
      } else {
        setAuthProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    authProfile,
    loading,
    signUp,
    login,
    logout,
    updateUserUsername,
    updateUserEmail,
    refreshAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

