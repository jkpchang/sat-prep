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

  // Write directly to all columns (stats JSONB column has been removed)
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      // Write to normalized columns (source of truth)
      total_xp: stats.totalXP,
      day_streak: stats.dayStreak,
      questions_answered: stats.questionsAnswered,
      correct_answers: stats.correctAnswers,
      answer_streak: stats.answerStreak,
      // Write to new columns for remaining fields
      last_question_date: stats.lastQuestionDate,
      questions_answered_today: stats.questionsAnsweredToday,
      last_valid_streak_date: stats.lastValidStreakDate,
      achievements: stats.achievements,
      answered_question_ids: stats.answeredQuestionIds,
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
