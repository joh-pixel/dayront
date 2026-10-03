/**
 * src/ui/mobile/haptic.ts
 * ----------------------------------------------------------------------------
 * Shared haptic feedback helper.
 * Respects the user's "Haptics" preference in Settings.
 */
import { getSettings } from '../../core/storage';

/**
 * Trigger a short vibration.
 * Silently no-ops on desktop, iOS Safari, or when the user disabled haptics.
 */
export function haptic(ms = 8): void {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try {
    if (!getSettings().haptics) return;
    navigator.vibrate(ms);
  } catch {
    // Some browsers throw when called without a user gesture — safe to ignore
  }
}