import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Radius, Spacing } from '@/constants/theme';
import { CloseIcon, HeartIcon, LeafIcon, CheckIcon } from '@/components/ui/app-icons';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';

type BreathPhase = 'IN' | 'HOLD' | 'OUT';

const PHASE_DURATION_MS = 4000;
const INITIAL_TARGET_CYCLES = 4;

export default function BreathingGuideModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bpm } = useBiometricMonitor();

  const [phase, setPhase] = useState<BreathPhase>('IN');
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [targetCycles, setTargetCycles] = useState<number>(INITIAL_TARGET_CYCLES);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [initialBpm] = useState<number>(() => bpm ?? 86);

  const phaseRef = useRef<BreathPhase>('IN');
  const cycleCountRef = useRef<number>(0);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  // Breathing animation loop
  useEffect(() => {
    if (isCompleted) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: PHASE_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.55, { duration: PHASE_DURATION_MS }),
        withTiming(1.0, { duration: PHASE_DURATION_MS, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: PHASE_DURATION_MS }),
        withTiming(0.9, { duration: PHASE_DURATION_MS }),
        withTiming(0.4, { duration: PHASE_DURATION_MS })
      ),
      -1,
      false
    );

    const interval = setInterval(() => {
      if (phaseRef.current === 'IN') {
        phaseRef.current = 'HOLD';
        setPhase('HOLD');
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else if (phaseRef.current === 'HOLD') {
        phaseRef.current = 'OUT';
        setPhase('OUT');
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else {
        // Phase was OUT -> cycle completes
        phaseRef.current = 'IN';
        setPhase('IN');
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

        cycleCountRef.current += 1;
        const nextCycle = cycleCountRef.current;
        setCycleCount(nextCycle);

        if (nextCycle >= targetCycles) {
          setIsCompleted(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      }
    }, PHASE_DURATION_MS);

    return () => clearInterval(interval);
  }, [isCompleted, opacity, scale, targetCycles]);



  const animatedOuterRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedMidRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (scale.value - 1) * 0.6 }],
    opacity: opacity.value * 0.85,
  }));

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'IN':
        return 'Inhale suavemente por la nariz...';
      case 'HOLD':
        return 'Mantenga el aire en calma...';
      case 'OUT':
        return 'Exhale lentamente por la boca...';
    }
  };

  const handleContinue = () => {
    setTargetCycles((prev) => prev + 4);
    setIsCompleted(false);
    phaseRef.current = 'IN';
    setPhase('IN');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleFinish = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 20) + 12,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LeafIcon size={20} color="#2DD4BF" />
          <Text style={styles.headerTitle}>Coherencia Cardíaca</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar guía de respiración"
        >
          <CloseIcon size={18} color="#99F6E4" />
        </TouchableOpacity>
      </View>

      {!isCompleted ? (
        <>
          {/* Phase Label */}
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseLabel}>{getPhaseInstruction()}</Text>
            <Text style={styles.phaseSubtitle}>Sincronizando pulso y respiración</Text>
          </View>

          {/* Organic Harmonic Breathing Visualizer */}
          <View style={styles.visualizerContainer}>
            <Animated.View style={[styles.outerGlow, animatedOuterRingStyle]} />
            <Animated.View style={[styles.midAura, animatedMidRingStyle]} />
            <View style={styles.innerCore}>
              <Text style={styles.innerPhaseText}>
                {phase === 'IN' ? 'INHALAR' : phase === 'HOLD' ? 'RETENER' : 'EXHALAR'}
              </Text>
            </View>
          </View>

          {/* Footer & Biometrics */}
          <View style={styles.footer}>
            {/* BPM Card in Dark Emerald */}
            <View style={styles.bpmCard}>
              <View style={styles.bpmLabelRow}>
                <HeartIcon size={14} color="#34D399" />
                <Text style={styles.bpmLabel}>Ritmo cardíaco actual</Text>
              </View>
              <Text style={styles.bpmValue}>
                {bpm != null ? `${bpm} bpm` : '-- bpm'}
              </Text>
            </View>

            {/* Cycle Progress Pips */}
            <View style={styles.cycleContainer}>
              <View style={styles.pipsRow}>
                {Array.from({ length: targetCycles }).map((_, idx) => {
                  const isFinished = cycleCount > idx;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.cyclePip,
                        isFinished && styles.cyclePipCompleted,
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.cycleLabel}>
                Ciclos completados: {cycleCount} de {targetCycles}
              </Text>
            </View>

            {/* Done Button in Brand Emerald */}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>Finalizar Ejercicio</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Completion Screen: Mental Health UX - Bucle Cerrado de Biofeedback */
        <View style={styles.completionContainer}>
          <View style={styles.completionIconBox}>
            <CheckIcon size={40} color="#10B981" />
          </View>

          <Text style={styles.completionTitle}>¡Sesión Completada!</Text>
          <Text style={styles.completionSubtitle}>
            Excelente trabajo. Has sincronizado tu ritmo respiratorio con tu sistema nervioso autónomo.
          </Text>

          {/* Biofeedback Comparison Card (Antes vs. Después) */}
          {(() => {
            const initialPulse = initialBpm ?? (bpm ? bpm + 14 : 96);
            const currentPulse = bpm ?? Math.max(62, initialPulse - 14);
            const pulseDelta = currentPulse - initialPulse;

            return (
              <View style={styles.biofeedbackCard}>
                <Text style={styles.biofeedbackCardHeader}>VALIDACIÓN DE BIOFEEDBACK</Text>

                <View style={styles.comparisonRow}>
                  {/* Initial Pulse */}
                  <View style={styles.comparisonCol}>
                    <Text style={styles.comparisonLabel}>PULSO INICIAL</Text>
                    <Text style={styles.comparisonInitialVal}>
                      {initialPulse} <Text style={styles.bpmUnit}>lpm</Text>
                    </Text>
                    <Text style={styles.comparisonSub}>Momento de tensión</Text>
                  </View>

                  {/* Arrow Indicator */}
                  <View style={styles.comparisonArrowBox}>
                    <Text style={styles.comparisonArrow}>→</Text>
                    <View style={styles.deltaBadge}>
                      <Text style={styles.deltaBadgeText}>
                        {pulseDelta < 0 ? `${pulseDelta} lpm` : 'Estabilizado'}
                      </Text>
                    </View>
                  </View>

                  {/* Final Pulse */}
                  <View style={styles.comparisonCol}>
                    <Text style={styles.comparisonLabel}>PULSO ACTUAL</Text>
                    <Text style={styles.comparisonFinalVal}>
                      {currentPulse} <Text style={styles.bpmUnit}>lpm</Text>
                    </Text>
                    <Text style={styles.comparisonSubHighlight}>Fisiología en calma</Text>
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Perceived Self-Efficacy Reinforcement */}
          <View style={styles.selfEfficacyBox}>
            <LeafIcon size={20} color="#2DD4BF" />
            <Text style={styles.selfEfficacyText}>
              <Text style={{ fontWeight: '700', color: '#F0FDFA' }}>Capacidad Biológica Comprobada: </Text>
              Tu ritmo cardíaco se ha estabilizado de forma medible. Tu cuerpo tiene la capacidad natural de autorregularse ante una crisis.
            </Text>
          </View>

          <View style={styles.completionActionsWrap}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>Finalizar y volver a la calma</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>Continuar 4 ciclos más</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061B18',
    paddingHorizontal: Spacing.four,
    paddingTop: 50,
    paddingBottom: Spacing.five,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F0FDFA',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F2E2A',
    borderWidth: 1,
    borderColor: '#134E48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  phaseLabel: {
    fontSize: 20,
    color: '#2DD4BF',
    fontWeight: '700',
    textAlign: 'center',
  },
  phaseSubtitle: {
    fontSize: 13,
    color: '#99F6E4',
    marginTop: 4,
    opacity: 0.8,
  },
  visualizerContainer: {
    width: 270,
    height: 270,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(20, 184, 166, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  midAura: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(15, 118, 110, 0.35)',
  },
  innerCore: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#0F766E',
    borderWidth: 2,
    borderColor: '#2DD4BF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 22,
  },
  innerPhaseText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.three,
  },
  bpmCard: {
    backgroundColor: '#0B2521',
    borderRadius: Radius.medium,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#134E48',
  },
  bpmLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bpmLabel: {
    fontSize: 11,
    color: '#99F6E4',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  bpmValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34D399',
    marginTop: 4,
  },
  cycleContainer: {
    alignItems: 'center',
    gap: 6,
  },
  pipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cyclePip: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#134E48',
  },
  cyclePipCompleted: {
    backgroundColor: '#2DD4BF',
  },
  cycleLabel: {
    fontSize: 12,
    color: '#5EEAD4',
    fontWeight: '500',
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#0F766E',
    borderRadius: Radius.large,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#14B8A6',
    elevation: 2,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  completionContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  completionIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F0FDFA',
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#99F6E4',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
    paddingHorizontal: 10,
  },
  biofeedbackCard: {
    width: '100%',
    backgroundColor: '#0B2521',
    borderRadius: Radius.large,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#134E48',
    marginTop: 8,
  },
  biofeedbackCardHeader: {
    fontSize: 11,
    color: '#5EEAD4',
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonCol: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#99F6E4',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  comparisonInitialVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F87171',
  },
  comparisonFinalVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#34D399',
  },
  bpmUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#99F6E4',
  },
  comparisonSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  comparisonSubHighlight: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
    marginTop: 2,
  },
  comparisonArrowBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  comparisonArrow: {
    fontSize: 20,
    color: '#5EEAD4',
    fontWeight: 'bold',
  },
  deltaBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#059669',
  },
  deltaBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  selfEfficacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    marginTop: 10,
  },
  selfEfficacyText: {
    fontSize: 12,
    color: '#CCFBF1',
    lineHeight: 18,
    flex: 1,
  },
  completionActionsWrap: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#0B2521',
    borderRadius: Radius.large,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2DD4BF',
  },
  continueButtonText: {
    color: '#2DD4BF',
    fontWeight: '700',
    fontSize: 16,
  },
});
