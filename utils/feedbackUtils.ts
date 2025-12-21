import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { Paths, File } from "expo-file-system";

let isAudioModeSet = false;
let webAudioContext: AudioContext | null = null;
let successSound: Audio.Sound | null = null;

/**
 * Generate a subtle "tada" success sound as WAV file data (Uint8Array)
 * Creates a pleasant ascending musical flourish (C-E-G arpeggio)
 */
function generateTadaSoundWav(): Uint8Array {
  // Create a minimal WAV file (tada sound, 0.25 seconds, 44.1kHz sample rate)
  const sampleRate = 44100;
  const duration = 0.25;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  // Musical notes for a pleasant "tada" (C major arpeggio: C4, E4, G4)
  // Frequencies: C4=261.63Hz, E4=329.63Hz, G4=392.00Hz
  const notes = [
    { freq: 261.63, startTime: 0.0, endTime: 0.08 }, // C
    { freq: 329.63, startTime: 0.06, endTime: 0.16 }, // E (overlaps slightly)
    { freq: 392.0, startTime: 0.12, endTime: 0.25 }, // G (overlaps)
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Mix all active notes
    for (const note of notes) {
      if (t >= note.startTime && t <= note.endTime) {
        // Calculate note-specific envelope
        const noteDuration = note.endTime - note.startTime;
        const noteTime = t - note.startTime;
        // Quick fade in, gentle fade out
        const fadeIn = Math.min(1, noteTime / 0.02);
        const fadeOut = Math.min(1, (noteDuration - noteTime) / 0.08);
        const envelope = fadeIn * fadeOut;

        // Add this note to the mix (lower volume for subtlety)
        sample +=
          Math.sin(2 * Math.PI * note.freq * noteTime) * envelope * 0.15;
      }
    }

    // Apply overall envelope for smooth start/end
    const overallEnvelope =
      Math.min(1, t / 0.02) * Math.min(1, (duration - t) / 0.1);
    samples[i] = sample * overallEnvelope;
  }

  // Convert to 16-bit PCM
  const pcm = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Create WAV file header
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, 1, true); // num channels (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Combine header and PCM data
  const wavFile = new Uint8Array(44 + numSamples * 2);
  wavFile.set(new Uint8Array(wavHeader), 0);
  wavFile.set(new Uint8Array(pcm.buffer), 44);

  return wavFile;
}

/**
 * Initialize audio mode for sound playback
 * This should be called once when the app starts
 */
export async function initializeFeedbackSound(): Promise<void> {
  if (isAudioModeSet) return;

  try {
    if (Platform.OS === "web") {
      // For web, initialize Web Audio API
      if (typeof window !== "undefined" && window.AudioContext) {
        webAudioContext = new AudioContext();
      }
    } else {
      // For native platforms, set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Preload the success sound for native platforms
      // We'll create it on-demand in playSuccessSound to avoid file system issues
    }
    isAudioModeSet = true;
  } catch (error) {
    // Continue without sound if initialization fails
    isAudioModeSet = true;
  }
}

/**
 * Play a success sound effect using Web Audio API (for web)
 */
function playWebSound(): void {
  try {
    if (!webAudioContext) {
      webAudioContext = new AudioContext();
    }

    // Create a subtle "tada" sound using multiple oscillators for a musical flourish

    const notes = [
      { freq: 261.63, startTime: 0.0, duration: 0.08 }, // C
      { freq: 329.63, startTime: 0.06, duration: 0.1 }, // E
      { freq: 392.0, startTime: 0.12, duration: 0.13 }, // G
    ];

    notes.forEach((note) => {
      const osc = webAudioContext!.createOscillator();
      const gain = webAudioContext!.createGain();

      osc.connect(gain);
      gain.connect(webAudioContext!.destination);

      osc.frequency.value = note.freq;
      osc.type = "sine";

      const start = webAudioContext!.currentTime + note.startTime;
      const end = start + note.duration;

      // Envelope for each note
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, end);

      osc.start(start);
      osc.stop(end);
    });
  } catch (error) {
    // Silently fail if Web Audio API isn't available
  }
}

/**
 * Play a success sound effect
 * Uses platform-appropriate sound feedback
 */
async function playSuccessSound(): Promise<void> {
  try {
    if (!isAudioModeSet) {
      await initializeFeedbackSound();
    }

    if (Platform.OS === "web") {
      // For web, use Web Audio API
      playWebSound();
    } else {
      // For native platforms (iOS/Android), play actual sound
      try {
        if (successSound) {
          // Reset sound to beginning and play
          await successSound.replayAsync();
        } else {
          // Create sound file on-demand
          const wavData = generateTadaSoundWav();

          // Write to temporary file using new expo-file-system API
          const soundFile = new File(Paths.cache, "success_beep.wav");
          await soundFile.write(wavData);

          // Create and play sound from file
          const { sound } = await Audio.Sound.createAsync(
            { uri: soundFile.uri },
            { shouldPlay: true, volume: 1.0 }
          );
          successSound = sound;
        }
      } catch (error) {
        // If sound playback fails, silently continue
        // Haptic feedback will still work
      }
    }
  } catch (error) {
    // Silently fail if sound can't be played
    // Haptic feedback will still work on native
  }
}

/**
 * Trigger haptic feedback (vibration/shake)
 * Only works on native platforms (iOS/Android)
 */
async function triggerHapticFeedback(): Promise<void> {
  // Haptics only work on native platforms, not web
  if (Platform.OS === "web") {
    return;
  }

  try {
    // Use medium impact for a satisfying shake/vibration
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Fallback to notification feedback if impact isn't available
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      // Silently fail if haptics aren't available on this device
      // This is expected on some devices/simulators
    }
  }
}

/**
 * Common function to provide haptic feedback and sound for success events
 * Use this when:
 * - Answering a question correctly
 * - Collecting XP
 * - Any other success/achievement moments
 */
export async function triggerSuccessFeedback(): Promise<void> {
  // Trigger both haptic and sound in parallel for immediate feedback
  // The notification haptic provides sound on iOS, and impact provides the shake
  await Promise.all([triggerHapticFeedback(), playSuccessSound()]);
}

/**
 * Cleanup function (optional, for when app closes)
 */
export async function cleanupFeedbackSound(): Promise<void> {
  try {
    if (successSound) {
      await successSound.unloadAsync();
      successSound = null;
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}
