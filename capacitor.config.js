module.exports = {
  appId: 'com.keyunit.auth',
  appName: 'Auth System',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Permite comunicação com API externa
    cleartext: true,
    // Hostname da API para Android
    hostname: 'localhost'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};
