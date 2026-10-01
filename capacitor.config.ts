import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dayront.app',
  appName: 'Dayront',
  webDir: 'dist/client',  // ← changed from 'dist'

  server: {
    url: 'https://dayront.com/app',
    cleartext: false,
    androidScheme: 'https',
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#2CB5F0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#2CB5F0',
    },
  },
};

export default config;