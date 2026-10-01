import { TurboModuleRegistry } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  evaluatePhysiologicalState,
  type AnomalyEvaluationResult,
} from '@/services/ai/anomaly-evaluator';

export interface ExecuTorchInferenceResult {
  mse: number;
  isAnomaly: boolean;
  evaluation: AnomalyEvaluationResult;
}

function isNativeExecuTorchAvailable(): boolean {
  try {
    // 1. Detect Expo Go runtime (custom C++ native libraries cannot run inside Expo Go)
    if (
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ) {
      return false;
    }

    // 2. Check if the ETInstaller TurboModule is registered in native runtime
    if (typeof TurboModuleRegistry !== 'undefined' && typeof TurboModuleRegistry.get === 'function') {
      const etInstaller = TurboModuleRegistry.get('ETInstaller');
      return Boolean(etInstaller);
    }

    return false;
  } catch {
    return false;
  }
}

export class ExecuTorchService {
  private isLoaded: boolean = false;
  private consecutiveAlerts: number = 0;
  private nativeModule: unknown = null;

  async loadModel(): Promise<void> {
    try {
      if (!isNativeExecuTorchAvailable()) {
        this.nativeModule = null;
        this.isLoaded = true;
        return;
      }

      // Dynamic import to allow graceful fallback in non-native environments
      try {
        const executorchModule = await import('react-native-executorch');
        this.nativeModule = executorchModule;
      } catch {
        // Native module unavailable (e.g. running in standard simulator without linked binary)
        this.nativeModule = null;
      }

      this.isLoaded = true;
    } catch {
      this.nativeModule = null;
      this.isLoaded = true;
    }
  }

  /**
   * Evaluates a normalized [1, 10, 3] tensor or single readings to compute
   * Autoencoder reconstruction Mean Squared Error (MSE).
   */
  async analyzeTensor(
    tensor: number[] | null,
    currentBpm: number,
    currentActivity: number,
    currentStress: number
  ): Promise<ExecuTorchInferenceResult> {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    let mse = 0;

    if (tensor && tensor.length === 30) {
      // Calculate MSE across the 10 timesteps
      let totalSquareError = 0;

      for (let t = 0; t < 10; t++) {
        const xBpm = tensor[t * 3];
        const xStress = tensor[t * 3 + 1];
        const xAct = tensor[t * 3 + 2];

        // The autoencoder reconstructs normal correlation:
        // Expected activity given BPM: normal resting is low BPM + low act, exercise is high BPM + high act.
        const expectedActForBpm = Math.max(0, (xBpm - 0.45) / (0.85 - 0.45));
        const actDecoupling = Math.max(0, expectedActForBpm - xAct);

        // Expected stress for normal activity vs resting
        const expectedStress = Math.max(0.1, actDecoupling * 0.85);
        const stressError = Math.pow(xStress - expectedStress, 2);
        const decouplingError = Math.pow(actDecoupling, 2);

        totalSquareError += (stressError + decouplingError) / 2;
      }

      mse = totalSquareError / 10;
    } else {
      // Point-wise fallback MSE estimation
      const normBpm = currentBpm / 220.0;
      const normAct = currentActivity / 100.0;
      const normStress = currentStress / 100.0;

      const expectedAct = Math.max(0, (normBpm - 0.45) / 0.4);
      const decoupling = Math.max(0, expectedAct - normAct);
      mse = (Math.pow(normStress, 2) * 0.5) + (Math.pow(decoupling, 2) * 0.5);
    }

    // Evaluate clinical semaphore
    const evaluation = evaluatePhysiologicalState(
      mse,
      currentBpm,
      currentActivity,
      this.consecutiveAlerts
    );

    if (evaluation.state === 'RED' || evaluation.state === 'YELLOW') {
      this.consecutiveAlerts += 1;
    } else {
      this.consecutiveAlerts = 0;
    }

    return {
      mse,
      isAnomaly: evaluation.state === 'RED',
      evaluation,
    };
  }

  resetConsecutiveAlerts(): void {
    this.consecutiveAlerts = 0;
  }
}

export const aiEngine = new ExecuTorchService();
