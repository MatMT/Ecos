import { useEffect, useState } from 'react';

import { aiEngine, type AnalysisResult } from '@/services/ai/execu-torch-service';
import { useBiometricSimulator } from '@/hooks/use-biometric-simulator';

export interface BiometricMonitorResult {
  bpm: number | null;
  stress: number | null;
  steps: number | null;
  analysis: AnalysisResult | null;
}

/** Combines the simulated sensor feed with the on-device inference engine into one live reading. */
export function useBiometricMonitor(): BiometricMonitorResult {
  const { currentData } = useBiometricSimulator();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    aiEngine.loadModel();
  }, []);

  useEffect(() => {
    if (!currentData) return;
    let cancelled = false;

    aiEngine.analyzeBiometrics(currentData.bpm, currentData.stress, currentData.steps).then((result) => {
      if (!cancelled) setAnalysis(result);
    });

    return () => {
      cancelled = true;
    };
  }, [currentData]);

  return {
    bpm: currentData?.bpm ?? null,
    stress: currentData?.stress ?? null,
    steps: currentData?.steps ?? null,
    analysis,
  };
}
