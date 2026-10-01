export interface BiometricSamplePoint {
  bpm: number;
  stress: number;
  activity: number;
  timestamp?: number;
}

export class RollingBuffer {
  private readonly windowSize: number;
  private readonly samples: BiometricSamplePoint[] = [];

  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  public addSample(sample: BiometricSamplePoint): void {
    this.samples.push({
      ...sample,
      timestamp: sample.timestamp ?? Date.now(),
    });

    if (this.samples.length > this.windowSize) {
      this.samples.shift();
    }
  }

  public isFull(): boolean {
    return this.samples.length >= this.windowSize;
  }

  public getSamples(): readonly BiometricSamplePoint[] {
    return this.samples;
  }

  public clear(): void {
    this.samples.length = 0;
  }

  /**
   * Returns a flattened array of normalized features of length (windowSize * 3),
   * formatted for ExecuTorch input [1, 10, 3]:
   * [X0_0, X1_0, X2_0, ..., X0_9, X1_9, X2_9]
   *
   * Normalization:
   * X0 = BPM / 220.0
   * X1 = Stress / 100.0
   * X2 = Activity / 100.0
   */
  public getNormalizedTensor(): number[] | null {
    if (!this.isFull()) {
      return null;
    }

    const flatTensor: number[] = [];

    for (let i = 0; i < this.windowSize; i++) {
      const sample = this.samples[i];
      const x0 = Math.max(0, Math.min(sample.bpm / 220.0, 1.0));
      const x1 = Math.max(0, Math.min(sample.stress / 100.0, 1.0));
      const x2 = Math.max(0, Math.min(sample.activity / 100.0, 1.0));
      flatTensor.push(x0, x1, x2);
    }

    return flatTensor;
  }
}
