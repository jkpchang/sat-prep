import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

let isAudioModeSet = false;
let webAudioContext: AudioContext | null = null;

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

    // Create a simple beep sound using Web Audio API
    const oscillator = webAudioContext.createOscillator();
    const gainNode = webAudioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(webAudioContext.destination);

    // Configure the beep: pleasant success tone
    oscillator.frequency.value = 800; // Higher pitch for success
    oscillator.type = "sine"; // Smooth sine wave

    // Quick fade in/out for pleasant sound
    gainNode.gain.setValueAtTime(0, webAudioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, webAudioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, webAudioContext.currentTime + 0.15);

    oscillator.start(webAudioContext.currentTime);
    oscillator.stop(webAudioContext.currentTime + 0.15);
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
      // For native platforms, use notification haptic which provides sound on iOS
      // On Android, this provides vibration
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // If notification haptics fail, that's okay - impact haptic will still work
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
  await Promise.all([
    triggerHapticFeedback(),
    playSuccessSound(),
  ]);
}

/**
 * Cleanup function (optional, for when app closes)
 */
export async function cleanupFeedbackSound(): Promise<void> {
  // No cleanup needed for current implementation
  // If you add sound files later, unload them here
}
