import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
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

import { Colors, Radius, Spacing } from '@/constants/theme';
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

  const dispatchTriggeredRef = useRef<boolean>(false);

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
          triggerEmergencyDispatch();
          return 0;
        }
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCancelled, isDispatched, triggerEmergencyDispatch]);

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
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 20) + 12,
          paddingBottom: Math.max(insets.bottom, 20) + 12,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.badge}>ATENCIÓN PRIORITARIA</Text>
      </View>

      {!isDispatched ? (
        <View style={styles.countdownSection}>
          <View style={styles.titleWrap}>
            <Text style={styles.alertTitle}>Activación de Emergencia</Text>
            <Text style={styles.alertSubtitle}>
              Enviando alerta crítica a su equipo de atención clínica en:
            </Text>
          </View>

          {/* Biometric Justification Card */}
          <View style={styles.justificationCard}>
            <View style={styles.justificationDot} />
            <Text style={styles.justificationText}>
              Desacople Autonómico Detectado • Pulso: {bpm ?? '--'} BPM | Actividad: {activity ?? 0}%
            </Text>
          </View>

          {/* Interactive Circular Countdown with Progress Ring & Fast-Track */}
          <TouchableOpacity
            style={styles.countdownTouchArea}
            onPress={triggerEmergencyDispatch}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Enviar alerta de emergencia inmediatamente"
            accessibilityHint="Toque el círculo central para despachar la alerta sin esperar el contador"
          >
            <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={styles.svgTimer}>
              <Circle
                cx={TIMER_SIZE / 2}
                cy={TIMER_SIZE / 2}
                r={RADIUS}
                stroke="rgba(239, 68, 68, 0.2)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              <Circle
                cx={TIMER_SIZE / 2}
                cy={TIMER_SIZE / 2}
                r={RADIUS}
                stroke="#EF4444"
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
                <Text style={styles.fastTrackText}>⚡ Toque para enviar ya</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Enhanced High-Contrast Cancel Button for Motor Tremor Accessibility */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.85}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Cancelar alerta de emergencia"
          >
            <Text style={styles.cancelButtonText}>Fue un error, me encuentro bien</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.dispatchedSection}>
          <View style={styles.dispatchedBadge}>
            <Text style={styles.dispatchedBadgeText}>ALERTA ENVIADA</Text>
          </View>
          <Text style={styles.alertTitle}>Su terapeuta ha sido notificado</Text>
          <Text style={styles.alertSubtitle}>
            Mantenga la calma. Puede comunicarse de forma inmediata a través de las siguientes líneas de asistencia:
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
    </View>
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
    backgroundColor: Colors.danger,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
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
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: Radius.medium,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  justificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  justificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FCA5A5',
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  countdownNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#EF4444',
    lineHeight: 60,
  },
  countdownUnit: {
    fontSize: 12,
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -4,
  },
  fastTrackBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  fastTrackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FEE2E2',
    letterSpacing: 0.5,
  },
  cancelButton: {
    minHeight: 56,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#64748B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.large,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  dispatchedSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  dispatchedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dispatchedBadgeText: {
    color: '#10B981',
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
