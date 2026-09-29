import { useEffect, useState, useRef } from 'react';

import { aiEngine, type ExecuTorchInferenceResult } from '@/services/ai/execu-torch-service';
import { calculateStressLevel } from '@/services/ai/stress-calculator';
import { RollingBuffer } from '@/services/ai/rolling-buffer';
import { saveBiometricSample } from '@/services/storage/local-db';
import { useBiometricSimulator } from '@/hooks/use-biometric-simulator';
import { useEsp32Ble, type BleConnectionStatus } from '@/hooks/use-esp32-ble';
import type { ClinicalTrafficState } from '@/services/ai/anomaly-evaluator';
import { useStudent, type SimulationScenario } from '@/hooks/use-student';

export interface BiometricMonitorResult {
  bpm: number | null;
  stress: number | null;
  activity: number | null;
  spo2: number | null;
  analysis: ExecuTorchInferenceResult | null;
  isBleConnected: boolean;
  isDemoMode: boolean;
  simulationScenario: SimulationScenario;
  bleStatus: BleConnectionStatus;
  deviceName: string | null;
  hardwareAlert: boolean;
  sosPressed: boolean;
  trafficState: ClinicalTrafficState;
  connectBle: () => Promise<void>;
  disconnectBle: () => Promise<void>;
}

export function useBiometricMonitor(overrideDemoMode?: boolean): BiometricMonitorResult {
  const { preferences } = useStudent();
  const isDemoMode = overrideDemoMode ?? preferences.demoMode ?? false;
  const currentScenario = preferences.simulationScenario ?? 'resting';

  const ble = useEsp32Ble();
  const isBleConnected = ble.status === 'connected';

  // Simulator runs ONLY if Demo Mode is explicitly enabled AND physical BLE is not connected
  const isSimulatorActive = !isBleConnected && isDemoMode;
  const simulator = useBiometricSimulator(1000, isSimulatorActive, currentScenario);

  const [analysis, setAnalysis] = useState<ExecuTorchInferenceResult | null>(null);
  const [trafficState, setTrafficState] = useState<ClinicalTrafficState>('GREEN');

  const rollingBufferRef = useRef<RollingBuffer>(new RollingBuffer(10));
  const lastSampleTimeRef = useRef<number>(0);

  // Active data source: Real BLE peripheral prioritized. If disconnected & Demo Mode is ON, uses simulator.
  const hasActiveDataSource = isBleConnected || isSimulatorActive;

  const rawBpm = isBleConnected
    ? (ble.bpm > 0 ? ble.bpm : 0)
    : isSimulatorActive
    ? (simulator.currentData?.bpm ?? 74)
    : 0;

  const rawActivity = isBleConnected
    ? ble.activityLevel
    : isSimulatorActive
    ? (simulator.currentData?.steps != null ? Math.min(100, simulator.currentData.steps) : 0)
    : 0;

  const rawSpo2 = isBleConnected ? ble.spo2 : isSimulatorActive ? 98 : 0;

  // Dynamic autonomic stress computation
  const calculatedStress = hasActiveDataSource ? calculateStressLevel(rawBpm, rawActivity) : null;

  useEffect(() => {
    void aiEngine.loadModel();
  }, []);

  useEffect(() => {
    if (!hasActiveDataSource || rawBpm <= 0) {
      return;
    }

    let isCancelled = false;

    // If vitals normalize to calm resting levels, purge stale historical panic samples
    if (rawBpm <= 85 && (calculatedStress ?? 0) < 30) {
      const historicalSamples = rollingBufferRef.current.getSamples();
      const hasStalePanicSamples = historicalSamples.some((s) => s.bpm > 115);
      if (hasStalePanicSamples) {
        rollingBufferRef.current.clear();
        aiEngine.resetConsecutiveAlerts();
      }
    }

    // Push into rolling buffer
    rollingBufferRef.current.addSample({
      bpm: rawBpm,
      activity: rawActivity,
      stress: calculatedStress ?? 25,
    });

    const tensor = rollingBufferRef.current.getNormalizedTensor();

    void aiEngine.analyzeTensor(tensor, rawBpm, rawActivity, calculatedStress ?? 25).then((result) => {
      if (isCancelled) return;
      setAnalysis(result);

      // Clinical Semaphore evaluation
      const effectiveState: ClinicalTrafficState =
        (isBleConnected && ble.hardwareAlert) || (rawBpm > 115 && rawActivity < 20)
          ? 'RED'
          : rawBpm > 95 && rawActivity < 30
          ? 'YELLOW'
          : rawBpm <= 90
          ? 'GREEN'
          : result.evaluation.state;

      setTrafficState(effectiveState);

      // Periodically persist sample to local SQLite (throttled to every 3 seconds)
      const now = Date.now();
      if (now - lastSampleTimeRef.current >= 3000) {
        lastSampleTimeRef.current = now;
        saveBiometricSample({
          bpm: rawBpm,
          activity: rawActivity,
          spo2: rawSpo2,
          stress_level: calculatedStress ?? 25,
          mse_error: result.mse,
          is_anomaly: result.isAnomaly ? 1 : 0,
        }).catch(() => {
          // Non-critical local persistence error ignored
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [hasActiveDataSource, rawBpm, rawActivity, calculatedStress, rawSpo2, isBleConnected, ble.hardwareAlert]);

  return {
    bpm: hasActiveDataSource && rawBpm > 0 ? rawBpm : null,
    stress: hasActiveDataSource ? calculatedStress : null,
    activity: hasActiveDataSource ? rawActivity : null,
    spo2: hasActiveDataSource && rawSpo2 > 0 ? rawSpo2 : null,
    analysis: hasActiveDataSource && rawBpm > 0 ? analysis : null,
    isBleConnected,
    isDemoMode,
    simulationScenario: currentScenario,
    bleStatus: ble.status,
    deviceName: isBleConnected
      ? (ble.connectedDeviceName || 'Ecos Band')
      : isDemoMode
      ? 'Ecos Band (Demo)'
      : null,
    hardwareAlert: isBleConnected
      ? ble.hardwareAlert
      : (hasActiveDataSource && rawBpm > 115 && rawActivity < 20),
    sosPressed: isBleConnected ? ble.sosPressed : false,
    trafficState: hasActiveDataSource && rawBpm > 0 ? trafficState : 'GREEN',
    connectBle: ble.startScanAndConnect,
    disconnectBle: ble.disconnect,
  };
}
