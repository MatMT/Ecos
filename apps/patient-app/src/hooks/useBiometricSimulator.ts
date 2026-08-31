import { useState, useEffect } from 'react';

// TODO: Replace this dummy array with actual parsed JSON/CSV data from Xiaomi
// (from /results) when we integrate real datasets for production testing.
const DUMMY_DATA = [
  // Normal resting
  { time: 1707365580, bpm: 71, stress: 30, steps: 0 },
  { time: 1707366180, bpm: 79, stress: 24, steps: 0 },
  // Normal physical activity (High BPM, High Steps)
  { time: 1707366840, bpm: 120, stress: 29, steps: 85 },
  { time: 1707367380, bpm: 135, stress: 35, steps: 110 },
  // Normal resting again
  { time: 1707367440, bpm: 70, stress: 39, steps: 0 },
  // Simulated Anomaly (Panic Attack): High BPM, High Stress, ZERO Steps
  { time: 1707396300, bpm: 117, stress: 45, steps: 0 },
  { time: 1707396360, bpm: 126, stress: 47, steps: 0 },
  { time: 1707396420, bpm: 138, stress: 51, steps: 0 },
  { time: 1707396480, bpm: 147, stress: 55, steps: 0 },
];

export interface BiometricData {
  bpm: number;
  stress: number;
  steps: number;
}

export interface BiometricSimulationResult {
  currentData: BiometricData | null;
  // A flattened array of 30 normalized values (10 readings x 3 features) ready for ExecuTorch
  modelInput: number[] | null;
}

export function useBiometricSimulator(intervalMs: number = 1000): BiometricSimulationResult {
  const [currentData, setCurrentData] = useState<BiometricData | null>(null);
  const [history, setHistory] = useState<BiometricData[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (index < DUMMY_DATA.length) {
        const newData = {
          bpm: DUMMY_DATA[index].bpm,
          stress: DUMMY_DATA[index].stress,
          steps: DUMMY_DATA[index].steps,
        };
        
        setCurrentData(newData);
        
        // Maintain a rolling window of the last 10 readings
        setHistory((prev) => {
          const updated = [...prev, newData];
          if (updated.length > 10) {
            updated.shift();
          }
          return updated;
        });

        setIndex((prev) => (prev + 1) % DUMMY_DATA.length);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [index, intervalMs]);

  // Compute normalized model input when we have exactly 10 readings
  let modelInput: number[] | null = null;
  if (history.length === 10) {
    modelInput = history.flatMap(reading => [
      Math.min(reading.bpm / 220.0, 1.0),
      Math.min(reading.stress / 100.0, 1.0),
      Math.min(reading.steps / 200.0, 1.0),
    ]);
  }

  return { currentData, modelInput };
}
