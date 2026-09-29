import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityIcon, ShieldCheckIcon } from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ClinicalTrafficState } from '@/services/ai/anomaly-evaluator';

export interface TelemetryDashboardProps {
  isConnected: boolean;
  activeBpm: number;
  activeActivity: number;
  activeSpo2: number;
  trafficState: ClinicalTrafficState;
  hasAlert: boolean;
  bleSosPressed: boolean;
}

export function TelemetryDashboard({
  isConnected,
  activeBpm,
  activeActivity,
  activeSpo2,
  trafficState,
  hasAlert,
  bleSosPressed,
}: TelemetryDashboardProps) {
  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <ActivityIcon size={16} color={Colors.brand} />
        <Text style={styles.sectionHeading}>TELEMETRÍA EN TIEMPO REAL</Text>
        <View
          style={[
            styles.dataSourceBadge,
            { backgroundColor: isConnected ? '#DCFCE7' : '#E0F2FE' },
          ]}
        >
          <Text
            style={[
              styles.dataSourceBadgeText,
              { color: isConnected ? '#15803D' : '#0369A1' },
            ]}
          >
            {isConnected ? 'Hardware Físico' : 'Modo Simulación'}
          </Text>
        </View>
      </View>

      {/* Physiological Alert Banner */}
      {hasAlert && (
        <View style={styles.alertCard}>
          <ShieldCheckIcon size={18} color="#DC2626" />
          <View style={styles.alertCardContent}>
            <Text style={styles.alertCardTitle}>
              ¡Alerta de Desacople Autonómico!
            </Text>
            <Text style={styles.alertCardText}>
              Elevación del ritmo cardíaco detectada durante reposo corporal.
            </Text>
          </View>
        </View>
      )}

      {bleSosPressed && (
        <View style={styles.alertCard}>
          <Text style={styles.alertCardTitle}>¡Botón de Auxilio Presionado!</Text>
          <Text style={styles.alertCardText}>
            Se recibió una señal de asistencia inmediata desde la pulsera.
          </Text>
        </View>
      )}

      {/* Heart Rate Card */}
      <View style={styles.card}>
        <View style={styles.metricHeaderRow}>
          <Text style={styles.cardSubtitle}>RITMO CARDÍACO</Text>
          <View
            style={[
              styles.metricBadge,
              { backgroundColor: activeBpm > 100 ? '#FEE2E2' : '#F0FDFA' },
            ]}
          >
            <Text
              style={[
                styles.metricBadgeText,
                { color: activeBpm > 100 ? '#DC2626' : '#0D9488' },
              ]}
            >
              {activeBpm > 100 ? 'Frecuencia Elevada' : 'Ritmo Estable'}
            </Text>
          </View>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricValue}>{activeBpm}</Text>
          <Text style={styles.metricUnit}>BPM</Text>
        </View>
        <Text style={styles.rangeLegend}>
          Rango fisiológico de referencia: 60 - 90 BPM en reposo
        </Text>
      </View>

      {/* Physical Activity Card */}
      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>NIVEL DE ACTIVIDAD CORPORAL</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(100, Math.max(0, activeActivity))}%`,
              },
            ]}
          />
        </View>
        <View style={styles.percentageRow}>
          <Text style={styles.percentageLabel}>Intensidad de movimiento</Text>
          <Text style={styles.percentageValue}>{activeActivity}%</Text>
        </View>
      </View>

      {/* Secondary Metrics Grid */}
      <View style={styles.telemetryGrid}>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>Oxigenación (SpO2)</Text>
          <Text style={styles.miniValue}>{activeSpo2}%</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>Balance Autonómico</Text>
          <Text
            style={[
              styles.miniValue,
              { color: trafficState === 'RED' ? '#DC2626' : '#15803D' },
            ]}
          >
            {trafficState === 'RED' ? 'Tensión' : 'Estable'}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.two,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    flex: 1,
  },
  dataSourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  dataSourceBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertCardContent: {
    flex: 1,
  },
  alertCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  alertCardText: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.two,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  metricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  metricBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 4,
  },
  metricValue: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rangeLegend: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 5,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  percentageLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  percentageValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  miniValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
});
