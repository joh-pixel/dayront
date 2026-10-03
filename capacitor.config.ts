import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dayront.app',
  appName: 'Dayront',
  webDir: 'dist/client',

  /**
   * Load the mobile shell from the live site.
   * This keeps the app always up-to-date without rebuilding the APK.
   * The service worker caches everything after first load, so it works offline.
   */
  server: {
    url: 'https://dayront.com/app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'dayront.com',
      '*.dayront.com',
    ],
    /**
     * ★ Branded error page instead of Chrome's ERR_TIMED_OUT.
     * Served from `dist/client/error.html` (built from `public/error.html`).
     * Shown when the WebView can't reach the server on cold start.
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