export type ClinicalTrafficState = 'GREEN' | 'YELLOW' | 'RED';
export type RecommendedClinicalAction = 'NONE' | 'BREATHING_EXERCISE' | 'EMERGENCY_MODAL';

export interface AnomalyEvaluationResult {
  state: ClinicalTrafficState;
  mse: number;
  triggerEvent: boolean;
  recommendedAction: RecommendedClinicalAction;
}

export const MSE_ANOMALY_THRESHOLD = 0.045;
export const MSE_SEVERE_THRESHOLD = 0.085;

/**
 * Evaluates the physiological state according to the reconstruction error (MSE),
 * heart rate, and movement activity.
 */
export function evaluatePhysiologicalState(
  mse: number,
  bpm: number,
  activity: number,
  consecutiveAlerts: number = 0
): AnomalyEvaluationResult {
  // Normal state / Exercise: low reconstruction error OR high BPM explained by high physical activity
  if (mse < MSE_ANOMALY_THRESHOLD || (bpm > 110 && activity > 40)) {
    return {
      state: 'GREEN',
      mse,
      triggerEvent: false,
      recommendedAction: 'NONE',
    };
  }

  // Moderate Decoupling: Elevated heart rate with low movement for < 3 consecutive cycles
  if (mse >= MSE_ANOMALY_THRESHOLD && mse < MSE_SEVERE_THRESHOLD && consecutiveAlerts < 3) {
    return {
      state: 'YELLOW',
      mse,
      triggerEvent: false,
      recommendedAction: 'BREATHING_EXERCISE',
    };
  }

  // Acute Crisis / Sustained Severe Decoupling (Resting tachycardia, panic attack)
  return {
    state: 'RED',
    mse,
    triggerEvent: true,
    recommendedAction: 'EMERGENCY_MODAL',
  };
}
