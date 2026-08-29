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

export function useBiometricSimulator(intervalMs: number = 1000): BiometricData | null {
  const [currentData, setCurrentData] = useState<BiometricData | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (index < DUMMY_DATA.length) {
        setCurrentData({
          bpm: DUMMY_DATA[index].bpm,
          stress: DUMMY_DATA[index].stress,
          steps: DUMMY_DATA[index].steps,
        });
        setIndex((prev) => (prev + 1) % DUMMY_DATA.length);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [index, intervalMs]);

  return currentData;
}
