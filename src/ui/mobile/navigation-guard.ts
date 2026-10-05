/**
 * src/ui/mobile/navigation-guard.ts
 * ----------------------------------------------------------------------------
 * A lightweight navigation guard shared between MobileLayout (which owns
 * the native back button listener) and ToolScreen (which knows when a
 * job is running and navigation should be blocked).
 *
 * Why this exists:
 *   The browser's `beforeunload` event produces an ugly native Android
 *   dialog ("Confirm Navigation — Changes you made may not be saved")
 *   whenever we call `window.history.back()` while a tool is processing.
 *
 *   Instead, ToolScreen registers a guard function here when it starts a
 *   job. MobileLayout checks the guard BEFORE attempting any navigation.
 *   If the guard returns false, we never call `history.back()`, so the
 *   dialog never fires. Clean, silent, and under our control.
 */

type GuardFn = () => boolean;

let activeGuard: GuardFn | null = null;

/**
 * Register a guard. Called by ToolScreen when a job starts.
 * The guard should return `true` to allow navigation, `false` to block it.
 */
export function setNavigationGuard(fn: GuardFn): void {
  activeGuard = fn;
}

/** Remove the guard. Called when processing finishes or the tool unmounts. */
export function clearNavigationGuard(): void {
  activeGuard = null;
}

/** True if navigation is currently allowed (no guard, or guard permits it). */
export function canNavigate(): boolean {
  if (!activeGuard) return true;
  try {
    return activeGuard();
  } catch {
    return true;
  }
}