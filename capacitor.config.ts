import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dukafiti.app',
  appName: 'Dukafiti',
  webDir: 'dist',
  android: {
    path: 'android'
  },
  ios: {
    path: 'ios'
  }
};

export default config;
