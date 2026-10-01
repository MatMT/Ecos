import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Animated,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Radius, Spacing } from '@/constants/theme';
import { enqueueSync } from '@/services/storage/local-db';
import { authClient } from '@/services/api/auth-client';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';

const COUNTDOWN_SECONDS = 5;
const TIMER_SIZE = 190;
const STROKE_WIDTH = 7;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PanicAlertModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bpm, stress, activity } = useBiometricMonitor();

  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [fadeAnim] = useState<Animated.Value>(() => new Animated.Value(0));

  const dispatchTriggeredRef = useRef<boolean>(false);

  // Mental Health UX: Transición suave de 600ms para evitar el "efecto susto"
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const triggerEmergencyDispatch = useCallback(() => {
    if (dispatchTriggeredRef.current) return;
    dispatchTriggeredRef.current = true;
    setIsDispatched(true);

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

    const alertPayload = {
      alertType: 'panic_button',
      priority: 'critical',
      contextSummary: `Pulsación del botón de pánico. Frecuencia cardíaca registrada: ${bpm ?? '--'} bpm (Nivel de estrés: ${stress ?? '--'}%, actividad: ${activity ?? '--'}%).`,
      biometricRecordId: null,
    };

    // Attempt direct API transmission; if offline, enqueue for background sync
    authClient
      .apiFetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertPayload),
      })
      .catch(() => {
        // Enqueue offline sync item
        return enqueueSync('/api/v1/alerts', alertPayload);
      });
  }, [activity, bpm, stress]);

  useEffect(() => {
    if (isCancelled || isDispatched) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCancelled, isDispatched]);

  useEffect(() => {
    if (countdown === 0 && !isCancelled && !isDispatched) {
      triggerEmergencyDispatch();
    }
  }, [countdown, isCancelled, isDispatched, triggerEmergencyDispatch]);

  const handleCancel = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsCancelled(true);
    router.back();
  };

  const dialNumber = (phone: string) => {
    void Linking.openURL(`tel:${phone}`);
  };

  const strokeDashoffset = CIRCUMFERENCE * (1 - countdown / COUNTDOWN_SECONDS);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          paddingTop: Math.max(insets.top, 20) + 12,
          paddingBottom: Math.max(insets.bottom, 20) + 12,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.badge}>SOPORTE Y ACOMPAÑAMIENTO</Text>
      </View>

      {!isDispatched ? (
        <View style={styles.countdownSection}>
          <View style={styles.titleWrap}>
            <Text style={styles.alertTitle}>Estamos aquí contigo</Text>
            <Text style={styles.alertSubtitle}>
              El sistema lo tiene bajo control, respira hondo. Si necesitas asistencia, notificaremos a tu equipo clínico en:
            </Text>
          </View>

          {/* Biometric Justification Card */}
          <View style={styles.justificationCard}>
            <View style={styles.justificationDot} />
            <Text style={styles.justificationText}>
              Desacople fisiológico detectado • Pulso: {bpm ?? '--'} lpm | Nivel de estrés: {stress ?? '--'}%
            </Text>
          </View>

          {/* Interactive Circular Countdown with Progress Ring & Fast-Track */}
          <TouchableOpacity
            style={styles.countdownTouchArea}
            onPress={triggerEmergencyDispatch}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Solicitar apoyo clínico de inmediato"
            accessibilityHint="Toque el círculo central para notificar a su terapeuta sin esperar el contador"
          >
            <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={styles.svgTimer}>
              <Circle
                cx={TIMER_SIZE / 2}
                cy={TIMER_SIZE / 2}
                r={RADIUS}
                stroke="rgba(200, 109, 94, 0.2)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              <Circle
                cx={TIMER_SIZE / 2}
                cy={TIMER_SIZE / 2}
                r={RADIUS}
                stroke="#C86D5E"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${TIMER_SIZE / 2} ${TIMER_SIZE / 2})`}
              />
            </Svg>

            <View style={styles.countdownInnerContent}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownUnit}>segundos</Text>
              <View style={styles.fastTrackBadge}>
                <Text style={styles.fastTrackText}>Toque para notificar ya</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* High-Contrast Reassuring Cancel Button */}
          <View style={styles.cancelWrap}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.85}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Cancelar notificación de emergencia"
            >
              <Text style={styles.cancelButtonText}>Fue accidental, me encuentro bien</Text>
            </TouchableOpacity>
            <Text style={styles.cancelHint}>
              Puedes cancelar en cualquier momento sin ninguna repercusión.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.dispatchedSection}>
          <View style={styles.dispatchedBadge}>
            <Text style={styles.dispatchedBadgeText}>APOYO NOTIFICADO</Text>
          </View>
          <Text style={styles.alertTitle}>Tu equipo clínico está al tanto</Text>
          <Text style={styles.alertSubtitle}>
            Mantén la calma y concéntrate en tu respiración. Puedes comunicarte directamente a través de las siguientes líneas de asistencia:
          </Text>

          <View style={styles.contactsList}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => dialNumber('911')}
              activeOpacity={0.8}
            >
              <Text style={styles.contactTitle}>Línea Nacional de Emergencias</Text>
              <Text style={styles.contactSub}>Marcar al 911 (Atención 24/7)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => dialNumber('8009112000')}
              activeOpacity={0.8}
            >
              <Text style={styles.contactTitle}>Línea de la Vida</Text>
              <Text style={styles.contactSub}>800 911 2000 · Apoyo Psicológico Inmediato</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => dialNumber('+50322744444')}
              activeOpacity={0.8}
            >
              <Text style={styles.contactTitle}>Departamento de Psicología Institucional</Text>
              <Text style={styles.contactSub}>Centro de Atención Ecos</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.returnButtonText}>Regresar a Inicio</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#C86D5E',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.large,
  },
  countdownSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  alertSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  justificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(200, 109, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(200, 109, 94, 0.35)',
    borderRadius: Radius.medium,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  justificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C86D5E',
  },
  justificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2A99E',
    textAlign: 'center',
  },
  countdownTouchArea: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  svgTimer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  countdownInnerContent: {
    width: TIMER_SIZE - 20,
    height: TIMER_SIZE - 20,
    borderRadius: (TIMER_SIZE - 20) / 2,
    backgroundColor: 'rgba(200, 109, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(200, 109, 94, 0.4)',
  },
  countdownNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#C86D5E',
    lineHeight: 60,
  },
  countdownUnit: {
    fontSize: 12,
    color: '#E2A99E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -4,
  },
  fastTrackBadge: {
    backgroundColor: 'rgba(200, 109, 94, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(200, 109, 94, 0.5)',
  },
  fastTrackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FEE2E2',
    letterSpacing: 0.5,
  },
  cancelWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    minHeight: 56,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.large,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cancelHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  dispatchedSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  dispatchedBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  dispatchedBadgeText: {
    color: '#2DD4BF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  contactsList: {
    width: '100%',
    gap: Spacing.two,
    marginVertical: 10,
  },
  contactCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contactTitle: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  returnButton: {
    minHeight: 56,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: Radius.large,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
