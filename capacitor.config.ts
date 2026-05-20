import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.xcien.operaciones',
  appName: 'XCIEN Operaciones',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Para desarrollo apuntar al servidor local:
    // url: 'http://192.168.1.X:8080',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a1628',
  },
  android: {
    backgroundColor: '#0a1628',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a1628',
      showSpinner: false,
    },
  },
};

export default config;
