import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { enqueueSync } from '@/services/storage/local-db';
import { authClient } from '@/services/api/auth-client';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';

const COUNTDOWN_SECONDS = 5;

export default function PanicAlertModal() {
  const router = useRouter();
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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCancelled, isDispatched, triggerEmergencyDispatch]);

  const handleCancel = () => {
    setIsCancelled(true);
    router.back();
  };

  const dialNumber = (phone: string) => {
    void Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>ATENCIÓN PRIORITARIA</Text>
      </View>

      {!isDispatched ? (
        <View style={styles.countdownSection}>
          <Text style={styles.alertTitle}>Activación de Emergencia</Text>
          <Text style={styles.alertSubtitle}>
            Enviando alerta crítica a su equipo de atención clínica en:
          </Text>

          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownUnit}>segundos</Text>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
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
    paddingTop: 50,
    paddingBottom: Spacing.five,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
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
    alignItems: 'center',
    gap: Spacing.four,
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
  countdownCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  countdownNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#EF4444',
  },
  countdownUnit: {
    fontSize: 13,
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.large,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dispatchedSection: {
    alignItems: 'center',
    gap: Spacing.three,
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
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: Radius.large,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
