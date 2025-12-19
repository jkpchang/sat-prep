import { UserProgress } from "../types";
import { supabase } from "./supabaseClient";
import { getOrCreateDeviceId } from "./deviceId";

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
  const deviceId = await getOrCreateDeviceId();

  // Store the raw progress as JSON for now; we can normalize later if needed
  const { error } = await supabase.from("profiles").upsert(
    {
      device_id: deviceId,
      stats,
      last_seen_at: new Date().toISOString(),
    },
    {
      onConflict: "device_id",
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

export async function flushProfileStats(
  stats: StatsPayload
): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  await saveProfileStats(stats);
}


