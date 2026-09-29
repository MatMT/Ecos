import { useState, useEffect, useRef } from 'react';
import type { SimulationScenario } from '@/hooks/use-student';

export interface BiometricData {
  bpm: number;
  stress: number;
  steps: number;
}

export interface BiometricSimulationResult {
  currentData: BiometricData | null;
  modelInput: number[] | null;
}

interface ScenarioConfig {
  targetBpm: number;
  targetSteps: number;
  baseStress: number;
}

const SCENARIO_CONFIGS: Record<SimulationScenario, ScenarioConfig> = {
  resting: {
    targetBpm: 72,
    targetSteps: 0,
    baseStress: 20,
  },
  work_stress: {
    targetBpm: 94,
    targetSteps: 8,
    baseStress: 50,
  },
  panic_attack: {
    targetBpm: 126,
    targetSteps: 0,
    baseStress: 80,
  },
  physical_exercise: {
    targetBpm: 110,
    targetSteps: 75,
    baseStress: 32,
  },
};

export function useBiometricSimulator(
  intervalMs: number = 1000,
  enabled: boolean = true,
  scenario: SimulationScenario = 'resting'
): BiometricSimulationResult {
  const [currentData, setCurrentData] = useState<BiometricData | null>(null);
  const [history, setHistory] = useState<BiometricData[]>([]);

  // Persistent linear state across re-renders
  const stateRef = useRef<{
    currentBpm: number;
    currentSteps: number;
  }>({
    currentBpm: 74,
    currentSteps: 0,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const config = SCENARIO_CONFIGS[scenario] ?? SCENARIO_CONFIGS.resting;

    const timer = setInterval(() => {
      const state = stateRef.current;

      // 1. Smooth linear transition of BPM (max 1 BPM per step to eliminate erratic jumps)
      if (state.currentBpm < config.targetBpm) {
        state.currentBpm = Math.min(config.targetBpm, state.currentBpm + 1);
      } else if (state.currentBpm > config.targetBpm) {
        state.currentBpm = Math.max(config.targetBpm, state.currentBpm - 1);
      } else {
        // Natural physiological sinus rhythm micro-drift (±1 BPM fluctuation around target)
        const jitter = Math.random() > 0.65 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        state.currentBpm = Math.max(60, Math.min(145, state.currentBpm + jitter));
      }

      // 2. Smooth linear transition of physical movement (steps)
      if (state.currentSteps < config.targetSteps) {
        state.currentSteps = Math.min(config.targetSteps, state.currentSteps + 2);
      } else if (state.currentSteps > config.targetSteps) {
        state.currentSteps = Math.max(config.targetSteps, state.currentSteps - 2);
      }

      // 3. Dynamic autonomic stress computation
      const isAutonomicDecoupled = state.currentBpm > 100 && state.currentSteps < 15;
      let calculatedStress: number;
      if (isAutonomicDecoupled) {
        // High autonomic decoupling (Panic / Acute anxiety)
        calculatedStress = Math.min(88, Math.round(55 + ((state.currentBpm - 100) / 26) * 30));
      } else if (scenario === 'physical_exercise') {
        // Healthy physiological exertion
        calculatedStress = Math.min(42, Math.round(25 + (state.currentBpm / 150) * 15));
      } else if (scenario === 'work_stress') {
        // Moderate cognitive/academic load
        calculatedStress = Math.min(60, Math.round(40 + (state.currentBpm - 80) * 0.8));
      } else {
        // Calm resting baseline
        calculatedStress = Math.max(15, Math.min(28, Math.round(20 + (state.currentBpm - 70))));
      }

      const sample: BiometricData = {
        bpm: state.currentBpm,
        stress: calculatedStress,
        steps: state.currentSteps,
      };

      setCurrentData(sample);

      setHistory((prev) => {
        const updated = [...prev, sample];
        if (updated.length > 10) {
          updated.shift();
        }
        return updated;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs, scenario]);

  let modelInput: number[] | null = null;
  if (history.length === 10) {
    modelInput = history.flatMap((reading) => [
      Math.min(reading.bpm / 220.0, 1.0),
      Math.min(reading.stress / 100.0, 1.0),
      Math.min(reading.steps / 200.0, 1.0),
    ]);
  }

  return {
    currentData: enabled ? currentData : null,
    modelInput: enabled ? modelInput : null,
  };
}
