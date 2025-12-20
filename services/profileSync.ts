import { UserProgress } from "../types";
import { supabase } from "./supabaseClient";
import { ensureAnonymousAuth } from "./auth";

type StatsPayload = Pick<
  UserProgress,
  | "dayStreak"
  | "totalXP"
  | "questionsAnswered"
  | "correctAnswers"
  | "answerStreak"
  | "lastQuestionDate"
  | "questionsAnsweredToday"
  | "lastValidStreakDate"
  | "achievements"
  | "answeredQuestionIds"
>;

let saveTimeout: NodeJS.Timeout | null = null;

export async function saveProfileStats(stats: StatsPayload): Promise<void> {
  // Get current user (should be anonymous if not logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId = user?.id;

  if (!userId) {
    // Try to ensure anonymous auth
    const { userId: anonymousUserId, error } = await ensureAnonymousAuth();
    if (error || !anonymousUserId) {
      console.warn("Failed to get anonymous auth for profile sync", error);
      return;
    }
    userId = anonymousUserId;
  }

  // Store the raw progress as JSON for now; we can normalize later if needed
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      stats,
      last_seen_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.warn("Failed to save profile stats to Supabase", error);
  }
}

export function scheduleSaveProfileStats(
  stats: StatsPayload,
  delayMs: number = 10000
): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveProfileStats(stats);
    saveTimeout = null;
  }, delayMs);
}
