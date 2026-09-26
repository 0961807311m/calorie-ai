import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ua.maksym.calorieai',
  appName: 'CalorieAI',
  webDir: 'public',
  server: {
    url: 'https://calorie-ai-heln.onrender.com',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false, // ← ГОЛОВНЕ: не ховаємо автоматично
      backgroundColor: '#07070c',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07070c',
      overlaysWebView: false,
    },
  },
};

export default config;