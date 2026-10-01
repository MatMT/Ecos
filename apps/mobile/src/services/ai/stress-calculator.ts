export interface StressCalculatorOptions {
  bpmBase?: number;
  bpmMax?: number;
  variability?: number;
}

const DEFAULT_BPM_BASE = 65;
const DEFAULT_BPM_MAX = 190;

/**
 * Calculates psychological stress index based on physiological decoupling
 * between heart rate and physical activity.
 *
 * Formula:
 * Stress = clamp(0, 100, [ ((BPM - BPM_base) / (BPM_max - BPM_base) * 100) * (1 - Activity / 100) ] + variability)
 */
export function calculateStressLevel(
  bpm: number,
  activityPercent: number,
  options: StressCalculatorOptions = {}
): number {
  const bpmBase = options.bpmBase ?? DEFAULT_BPM_BASE;
  const bpmMax = options.bpmMax ?? DEFAULT_BPM_MAX;
  const variability = options.variability ?? 0;

  // Clamped activity factor [0.0 - 1.0]
  const clampedActivity = Math.max(0, Math.min(activityPercent, 100)) / 100;
  const motorAttenuationFactor = 1.0 - clampedActivity;

  // Normal range check
  if (bpm <= bpmBase) {
    return Math.max(0, Math.min(100, Math.round(5 + variability)));
  }

  const rawFraction = (bpm - bpmBase) / (bpmMax - bpmBase);
  const normalizedElevation = Math.max(0, Math.min(1.0, rawFraction)) * 100;

  const calculatedStress = normalizedElevation * motorAttenuationFactor + variability;

  return Math.max(0, Math.min(100, Math.round(calculatedStress)));
}
