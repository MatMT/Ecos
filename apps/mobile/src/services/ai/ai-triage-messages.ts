import type { ClinicalTrafficState } from '@/services/ai/anomaly-evaluator';

export type TriageLevel = ClinicalTrafficState;

export const TRIAGE_MESSAGES: Record<TriageLevel, string[]> = {
  RED: [
    'Tu pulso está acelerado. Toma asiento y respiremos con calma.',
    'Tu cuerpo pide una pausa. Siéntate cómodo y suelta el aire despacio.',
    'Detectamos agitación en reposo. Regálate un minuto para recuperarte.',
    'Momento de frenar. Apoya tu espalda y concéntrate en respirar.',
    'Tu corazón late deprisa. Todo está bien, haz una pausa ahora.',
    'Tensión elevada en reposo. Detén lo que haces y bebe agua fresca.',
    'Tu cuerpo necesita calma. Respira hondo y recupera tu ritmo.',
    'Pulso alto sin movimiento. Siéntate y hagamos una pausa juntos.',
  ],
  YELLOW: [
    'Ligera agitación detectada. Una pausa breve te devolverá la calma.',
    'Tu pulso subió un poco. Buen momento para estirar y respirar hondo.',
    'El ritmo se siente algo tenso. Tómate dos minutos para despejarte.',
    'Tu cuerpo nota la prisa. Baja un poco la velocidad, vas muy bien.',
    'Pequeña tensión acumulada. Un respiro profundo te vendrá genial.',
    'Detectamos ligera inquietud. Bebe agua y relaja los hombros.',
    'Tu ritmo muestra variaciones. Un momento de calma renovará tu día.',
    'Pausa inteligente: sesenta segundos de calma para equilibrarte.',
  ],
  GREEN: [
    'Tu ritmo se mantiene sereno y estable. Excelente momento para enfocarte.',
    'Parámetros en perfecto balance. Disfruta tu día a tu propio ritmo.',
    'Tu cuerpo refleja calma y descanso. Te adaptas con naturalidad.',
    'Corazón y respiración en armonía. Gran momento para continuar.',
    'Tu pulso está tranquilo y sereno. Mantén esa sensación de paz.',
    'Excelente descanso y recuperación. Tu organismo fluye en balance.',
    'Biometría estable y serena. Tu mente se encuentra con claridad.',
    'Tu cuerpo recarga energía eficientemente. Todo marcha en orden.',
  ],
};

class TriageMessageManager {
  private lastLevel: TriageLevel | null = null;
  private currentMessage: string = TRIAGE_MESSAGES.GREEN[0];
  private lastRotationTimestamp: number = 0;
  private readonly rotationIntervalMs: number;

  constructor(rotationIntervalMs: number = 30000) {
    this.rotationIntervalMs = rotationIntervalMs;
  }

  public getMessage(level: TriageLevel, now: number = Date.now()): string {
    const levelChanged = this.lastLevel !== level;
    const timeElapsed = now - this.lastRotationTimestamp >= this.rotationIntervalMs;

    if (levelChanged || timeElapsed) {
      this.lastLevel = level;
      this.lastRotationTimestamp = now;
      this.currentMessage = this.pickRandomDifferent(level, this.currentMessage);
    }

    return this.currentMessage;
  }

  private pickRandomDifferent(level: TriageLevel, previous: string): string {
    const list = TRIAGE_MESSAGES[level];
    if (list.length <= 1) return list[0];

    let candidate: string;
    do {
      const idx = Math.floor(Math.random() * list.length);
      candidate = list[idx];
    } while (candidate === previous);

    return candidate;
  }
}

export const triageMessageManager = new TriageMessageManager();
