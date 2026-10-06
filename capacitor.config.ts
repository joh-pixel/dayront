import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dayront.app',
  appName: 'Dayront',
  webDir: 'dist/client',

  /**
   * ★ server.url is intentionally NOT set.
   *
   * Previously it was 'https://dayront.com/app', which made the WebView's
   * very first navigation remote. On DNS failure Chromium painted its own
   * "Web page not available" UI *before* Capacitor's onReceivedError could
   * swap in errorPath — producing a visible flash of Chrome's error page.
   *
   * Without server.url, the WebView boots from the bundled index.html,
   * which is a copy of error.html installed by the CI workflow
   * (.github/workflows/android.yml → "Use error.html as Capacitor boot
   * page"). That page probes connectivity and redirects to the live site
   * only when it is reachable. Offline = branded UI from the very first
   * frame, online = seamless handoff from the native splash.
   *
   * The live website is unaffected: dist/client/index.html on Vercel is
   * still the marketing homepage. The overwrite only happens inside the
   * Android CI pipeline, after the web build and before cap sync.
   */
  server: {
    cleartext: false,
    androidScheme: 'https',
    /**
     * Required: the boot page (running at https://localhost inside the
     * WebView) navigates to the live site via window.location.replace.
     * Capacitor only keeps that navigation inside the WebView when the
     * destination host is listed here — otherwise it opens the system
     * browser instead.
     */
    allowNavigation: [
      'dayront.com',
      '*.dayront.com',
    ],
    /**
     * Fallback only — if the bundled index.html itself somehow fails to
     * load, the WebView falls back to this. In the new boot flow this is
     * unreachable in practice.
     */
    errorPath: 'error.html',
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    /**
     * Debug-only WebView inspector.
     * Set to `true` to open chrome://inspect while developing.
     * Keep `false` for production — no console access for end users.
     */
    webContentsDebuggingEnabled: false,
    backgroundColor: '#2CB5F0',
  },

  ios: {
    contentInset: 'always',
    backgroundColor: '#2CB5F0',
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#2CB5F0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
      useDialog: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#2CB5F0',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    /**
     * FFmpeg plugin is auto-discovered from node_modules via the
     * "capacitor" field in its package.json. No explicit config needed here.
     */
  },
};

export default config;