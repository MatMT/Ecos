import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

// IA Edge Computing
import { useBiometricSimulator } from '@/hooks/useBiometricSimulator';
import { aiEngine } from '@/services/ai/ExecuTorchService';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // Initialize simulator (1 data point per second)
  const biometricData = useBiometricSimulator(1000);

  useEffect(() => {
    // Load local model if not already loaded
    aiEngine.loadModel();
  }, []);

  useEffect(() => {
    // Process incoming biometric data silently
    const processData = async () => {
      if (biometricData) {
        const { isAnomaly, riskScore } = await aiEngine.analyzeBiometrics(
          biometricData.bpm, 
          biometricData.stress, 
          biometricData.steps
        );
        if (isAnomaly) {
          // Warning in Spanish as per Localization & End-User Experience rules
          console.warn(`[🚨 CRISIS DETECTADA] Puntaje de riesgo: ${riskScore} (BPM: ${biometricData.bpm}, Estrés: ${biometricData.stress}, Pasos: ${biometricData.steps})`);
        }
      }
    };
    processData();
  }, [biometricData]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
