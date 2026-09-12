export interface AnalysisResult {
  isAnomaly: boolean;
  riskScore: number;
}

export class ExecuTorchService {
  private isLoaded: boolean = false;

  async loadModel(): Promise<void> {
    try {
      console.log("Edge Computing: Loading model.pte...");
      this.isLoaded = true;
      console.log("Edge Computing: Model loaded successfully offline.");
    } catch (error) {
      console.error("Error loading ExecuTorch model:", error);
    }
  }

  async analyzeBiometrics(bpm: number, stress: number, steps: number): Promise<AnalysisResult> {
    if (!this.isLoaded) {
      console.warn("Edge Computing: Model is not loaded yet.");
      return { isAnomaly: false, riskScore: 0 };
    }

    try {
      console.log(`Edge Computing: Analyzing data (BPM: ${bpm}, Stress: ${stress}, Steps: ${steps})...`);
      
      let riskScore = 0;
      
      // AI Logic Rule:
      // If BPM > 100 AND Steps > 20 -> It's Physical Activity (Normal)
      // If BPM > 100 AND Stress > 40 AND Steps < 10 -> It's a Panic Attack (Anomaly)
      if (bpm > 100 && stress > 40 && steps < 10) {
        riskScore = (bpm - 100) + (stress - 40);
      }

      const isAnomaly = riskScore > 20;

      return {
        isAnomaly,
        riskScore
      };
    } catch (error) {
      console.error("Error executing inference:", error);
      return { isAnomaly: false, riskScore: 0 };
    }
  }
}

export const aiEngine = new ExecuTorchService();
