import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BatteryChargingIcon, BluetoothIcon } from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface ConnectedHardwareCardProps {
  connectedDeviceName?: string | null;
}

export function ConnectedHardwareCard({ connectedDeviceName }: ConnectedHardwareCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <BluetoothIcon size={20} color="#0D9488" />
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.deviceTitle}>
            {connectedDeviceName ?? 'Ecos Band'}
          </Text>
          <Text style={styles.deviceSubtitle}>
            Enlace de baja energía (BLE) activo
          </Text>
        </View>
        <View style={styles.liveTag}>
          <Text style={styles.liveTagText}>Sincronizado</Text>
        </View>
      </View>

      {/* Battery / Power Supply Status */}
      <View style={styles.batterySection}>
        <View style={styles.batteryLabelRow}>
          <View style={styles.batteryLeftInfo}>
            <BatteryChargingIcon size={16} color="#15803D" />
            <Text style={styles.batteryLabel}>Batería</Text>
          </View>
          <View style={styles.batteryStatusPill}>
            <Text style={styles.batteryStatusPillText}>100% · Cargando</Text>
          </View>
        </View>
        <View style={styles.batteryTrack}>
          <View style={[styles.batteryFill, { width: '100%' }]} />
        </View>
        <Text style={styles.batterySubtext}>
          Cargando · 100%
        </Text>
      </View>

      {/* Sensors Status */}
      <View style={styles.sensorStatusBox}>
        <View style={styles.sensorItem}>
          <View style={styles.sensorIndicatorActive} />
          <Text style={styles.sensorText}>
            Sensor fotopletismógrafo (PPG / Pulso cardíaco)
          </Text>
        </View>
        <View style={styles.sensorItem}>
          <View style={styles.sensorIndicatorActive} />
          <Text style={styles.sensorText}>
            Acelerómetro triaxial de movimiento corporal
          </Text>
        </View>
        <View style={styles.sensorItem}>
          <View style={styles.sensorIndicatorActive} />
          <Text style={styles.sensorText}>
            Sincronización de telemetría a 1 Hz
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  deviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  deviceSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  liveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  liveTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  batterySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: 8,
  },
  batteryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batteryLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.text,
  },
  batteryStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  batteryStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  batteryTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    backgroundColor: '#15803D',
    borderRadius: 3,
  },
  batterySubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sensorStatusBox: {
    gap: 8,
    paddingTop: 4,
  },
  sensorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sensorIndicatorActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  sensorText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
