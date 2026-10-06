/**
 * src/ui/mobile/tool/native.ts
 * ----------------------------------------------------------------------------
 * Native (Capacitor) integrations used by the tool screen.
 *
 *   • isNativeApp()                  environment check
 *   • ensureNotificationPermission() ask once on mount
 *   • notifyJobDone()                "done" notification after a job
 *   • keepAwakeOn() / keepAwakeOff() stop the screen sleeping during a job
 *
 * Every function here is a no-op on the web and honours the user's
 * settings toggles. Capacitor plugins are imported DYNAMICALLY with a
 * `@vite-ignore` hint — a static import would break the browser bundle.
 */
import { getSettings } from '../../../core/storage';

/* ── Environment ────────────────────────────────────────── */

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true || w.__TAURI__ !== undefined;
}

/* ── Local notifications ────────────────────────────────── */

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (!getSettings().notifications) return false;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor/local-notifications');
    const LocalNotifications = mod.LocalNotifications;
    const cur = await LocalNotifications.checkPermissions();
    if (cur.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch { return false; }
}

export async function notifyJobDone(toolName: string, fileName: string) {
  if (!isNativeApp()) return;
  if (!getSettings().notifications) return;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor/local-notifications');
    await mod.LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2147483647),
        title: 'Dayront — Done!',
        body: `${fileName} is ready`,
        schedule: { at: new Date(Date.now() + 100) },
        smallIcon: 'ic_stat_icon_config_sample',
        channelId: 'dayront-jobs',
      }],
    });
  } catch (err) { console.warn('[notify] Failed:', err); }
}

/* ── Keep-awake during processing ───────────────────────── */

export async function keepAwakeOn() {
  if (!isNativeApp()) return;
  if (!getSettings().keepAwake) return;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor-community/keep-awake');
    await mod.KeepAwake.keepAwake();
  } catch {}
}

export async function keepAwakeOff() {
  if (!isNativeApp()) return;
  if (!getSettings().keepAwake) return;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor-community/keep-awake');
    await mod.KeepAwake.allowSleep();
  } catch {}
}