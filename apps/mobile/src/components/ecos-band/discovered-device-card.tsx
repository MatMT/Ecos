import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BluetoothIcon, SignalIcon, WatchIcon } from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ScannedDevice } from '@/hooks/use-esp32-ble';

export function getSignalQuality(rssi?: number | null): { label: string; color: string } {
  if (rssi == null) {
    return { label: 'Señal detectada', color: Colors.brand };
  }
  if (rssi >= -60) {
    return { label: `Señal óptima · ${rssi} dBm`, color: '#15803D' };
  }
  if (rssi >= -75) {
    return { label: `Señal buena · ${rssi} dBm`, color: '#0D9488' };
  }
  return { label: `Señal moderada · ${rssi} dBm`, color: '#D97706' };
}

export interface DiscoveredDeviceCardProps {
  device: ScannedDevice;
  isConnecting: boolean;
  connectingId: string | null;
  onConnect: (device: ScannedDevice) => void;
}

export function DiscoveredDeviceCard({
  device,
  isConnecting,
  connectingId,
  onConnect,
}: DiscoveredDeviceCardProps) {
  const signal = getSignalQuality(device.rssi);
  const isThisConnecting = isConnecting && connectingId === device.id;

  return (
    <View style={styles.primaryCard}>
      <View style={styles.primaryHeader}>
        <View style={styles.primaryIconBox}>
          <WatchIcon size={24} color="#0F766E" />
        </View>
        <View style={styles.primaryInfo}>
          <View style={styles.primaryNameRow}>
            <Text style={styles.primaryTitle}>Ecos Band</Text>
            <View style={styles.compatibleBadge}>
              <Text style={styles.compatibleBadgeText}>DISPOSITIVO OFICIAL</Text>
            </View>
          </View>
          <View style={styles.signalRow}>
            <SignalIcon size={14} color={signal.color} />
            <Text style={[styles.signalText, { color: signal.color }]}>
              {signal.label}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.connectBtn}
        onPress={() => onConnect(device)}
        disabled={isConnecting}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Vincular con la pulsera Ecos Band"
      >
        {isThisConnecting ? (
          <View style={styles.btnRowLoading}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.connectBtnText}>Enlazando...</Text>
          </View>
        ) : (
          <Text style={styles.connectBtnText}>Vincular ahora</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export interface SecondaryDevicesListProps {
  devices: ScannedDevice[];
  isConnecting: boolean;
  connectingId: string | null;
  onConnect: (device: ScannedDevice) => void;
}

export function SecondaryDevicesList({
  devices,
  isConnecting,
  connectingId,
  onConnect,
}: SecondaryDevicesListProps) {
  if (devices.length === 0) return null;

  return (
    <View style={styles.secondaryContainer}>
      <Text style={styles.secondaryHeading}>
        Otros dispositivos detectados ({devices.length})
      </Text>
      {devices.map((item) => {
        const isThisConnecting = isConnecting && connectingId === item.id;
        return (
          <View key={item.id} style={styles.secondaryItem}>
            <View style={styles.secondaryLeft}>
              <BluetoothIcon size={16} color="#64748B" />
              <View style={styles.secondaryTextWrap}>
                <Text style={styles.secondaryName}>
                  {item.name ?? 'Dispositivo BLE'}
                </Text>
                <Text style={styles.secondarySub}>
                  {item.rssi != null ? `${item.rssi} dBm · ` : ''}
                  ID: {item.id.slice(0, 14)}...
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => onConnect(item)}
              disabled={isConnecting}
              activeOpacity={0.8}
            >
              {isThisConnecting ? (
                <ActivityIndicator size="small" color={Colors.brand} />
              ) : (
                <Text style={styles.secondaryBtnText}>Conectar</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.large,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  primaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  primaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryInfo: {
    flex: 1,
    gap: 3,
  },
  primaryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532D',
  },
  compatibleBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  compatibleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectBtn: {
    backgroundColor: '#0F766E',
    borderRadius: Radius.medium,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  btnRowLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  secondaryHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  secondaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  secondaryTextWrap: {
    flex: 1,
  },
  secondaryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  secondarySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.small,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
});
