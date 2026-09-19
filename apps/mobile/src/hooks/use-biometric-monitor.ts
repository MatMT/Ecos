import { useEffect, useState, useRef } from 'react';

import { aiEngine, type ExecuTorchInferenceResult } from '@/services/ai/execu-torch-service';
import { calculateStressLevel } from '@/services/ai/stress-calculator';
import { RollingBuffer } from '@/services/ai/rolling-buffer';
import { saveBiometricSample } from '@/services/storage/local-db';
import { useBiometricSimulator } from '@/hooks/use-biometric-simulator';
import { useEsp32Ble, type BleConnectionStatus } from '@/hooks/use-esp32-ble';
import type { ClinicalTrafficState } from '@/services/ai/anomaly-evaluator';

export interface BiometricMonitorResult {
  bpm: number | null;
  stress: number | null;
  activity: number | null;
  spo2: number | null;
  analysis: ExecuTorchInferenceResult | null;
  isBleConnected: boolean;
  bleStatus: BleConnectionStatus;
  deviceName: string | null;
  hardwareAlert: boolean;
  sosPressed: boolean;
  trafficState: ClinicalTrafficState;
  connectBle: () => Promise<void>;
  disconnectBle: () => Promise<void>;
}

export function useBiometricMonitor(): BiometricMonitorResult {
  const ble = useEsp32Ble();
  const simulator = useBiometricSimulator(1000);

  const [analysis, setAnalysis] = useState<ExecuTorchInferenceResult | null>(null);
  const [trafficState, setTrafficState] = useState<ClinicalTrafficState>('GREEN');

  const rollingBufferRef = useRef<RollingBuffer>(new RollingBuffer(10));
  const lastSampleTimeRef = useRef<number>(0);

  const isBleConnected = ble.status === 'connected' && ble.bpm > 0;

  // Active data source selection
  const rawBpm = isBleConnected ? ble.bpm : (simulator.currentData?.bpm ?? 72);
  const rawActivity = isBleConnected ? ble.activityLevel : (simulator.currentData?.steps != null ? Math.min(100, simulator.currentData.steps) : 0);
  const rawSpo2 = isBleConnected ? ble.spo2 : 98;

  // Dynamic autonomic stress computation
  const calculatedStress = calculateStressLevel(rawBpm, rawActivity);

  useEffect(() => {
    void aiEngine.loadModel();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    // Push into rolling buffer
    rollingBufferRef.current.addSample({
      bpm: rawBpm,
      activity: rawActivity,
      stress: calculatedStress,
    });

    const tensor = rollingBufferRef.current.getNormalizedTensor();

    void aiEngine.analyzeTensor(tensor, rawBpm, rawActivity, calculatedStress).then((result) => {
      if (isCancelled) return;
      setAnalysis(result);
      setTrafficState(result.evaluation.state);

      // Periodically persist sample to local SQLite (throttled to every 3 seconds)
      const now = Date.now();
      if (now - lastSampleTimeRef.current >= 3000) {
        lastSampleTimeRef.current = now;
        saveBiometricSample({
          bpm: rawBpm,
          activity: rawActivity,
          spo2: rawSpo2,
          stress_level: calculatedStress,
          mse_error: result.mse,
          is_anomaly: result.isAnomaly ? 1 : 0,
        }).catch(() => {
          // Non-critical local persistence error swallowed
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [rawBpm, rawActivity, calculatedStress, rawSpo2]);

  return {
    bpm: rawBpm,
    stress: calculatedStress,
    activity: rawActivity,
    spo2: rawSpo2,
    analysis,
    isBleConnected,
    bleStatus: ble.status,
    deviceName: ble.connectedDeviceName,
    hardwareAlert: ble.hardwareAlert,
    sosPressed: ble.sosPressed,
    trafficState,
    connectBle: ble.startScanAndConnect,
    disconnectBle: ble.disconnect,
  };
}
