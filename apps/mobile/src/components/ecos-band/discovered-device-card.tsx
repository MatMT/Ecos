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
import { SwipeToConnect } from './swipe-to-connect';

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

      {/* Interactive Swipe to Connect Handshake Slider */}
      <View style={styles.sliderContainer}>
        <SwipeToConnect
          onConfirm={() => onConnect(device)}
          isConnecting={isThisConnecting}
          disabled={isConnecting}
        />
      </View>
    </View>
  );
}

export interface DiscoveredDevicesSectionProps {
  devices: ScannedDevice[];
  selectedDevice: ScannedDevice | null;
  onSelectDevice: (device: ScannedDevice) => void;
  isConnecting: boolean;
  connectingId: string | null;
  onConnect: (device: ScannedDevice) => void;
}

export function DiscoveredDevicesSection({
  devices,
  selectedDevice,
  onSelectDevice,
  isConnecting,
  connectingId,
  onConnect,
}: DiscoveredDevicesSectionProps) {
  if (devices.length === 0) return null;

  const activeDevice = selectedDevice ?? devices[0];
  const isThisConnecting = isConnecting && connectingId === activeDevice?.id;
  const activeSignal = getSignalQuality(activeDevice?.rssi);

  // When only 1 device is discovered: Show direct handshake card (NO redundant selection list or radio buttons)
  if (devices.length === 1) {
    const isOfficial =
      activeDevice.isCompatible ||
      activeDevice.name?.toLowerCase().includes('ecos') ||
      activeDevice.name?.toLowerCase().includes('band');

    return (
      <View style={styles.primaryCard}>
        <View style={styles.primaryHeader}>
          <View style={styles.primaryIconBox}>
            <WatchIcon size={24} color="#0F766E" />
          </View>
          <View style={styles.primaryInfo}>
            <View style={styles.primaryNameRow}>
              <Text style={styles.primaryTitle}>
                {activeDevice.name ?? 'Ecos Band'}
              </Text>
              {isOfficial && (
                <View style={styles.compatibleBadge}>
                  <Text style={styles.compatibleBadgeText}>DISPOSITIVO OFICIAL</Text>
                </View>
              )}
            </View>
            <View style={styles.signalRow}>
              <SignalIcon size={14} color={activeSignal.color} />
              <Text style={[styles.signalText, { color: activeSignal.color }]}>
                {activeSignal.label}
              </Text>
              <Text style={styles.idSubtext}>
                · ID: {activeDevice.id.slice(0, 10)}...
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <SwipeToConnect
            onConfirm={() => onConnect(activeDevice)}
            isConnecting={isThisConnecting}
            disabled={isConnecting}
          />
        </View>
      </View>
    );
  }

  // When multiple devices are discovered (> 1): Show selection list so user can choose WHICH band to connect to
  return (
    <View style={styles.sectionCard}>
      {/* Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>
          Dispositivos detectados ({devices.length})
        </Text>
        <Text style={styles.sectionHint}>
          Selecciona la pulsera que deseas vincular
        </Text>
      </View>

      {/* List of Discovered Devices */}
      <View style={styles.devicesList}>
        {devices.map((item) => {
          const isSelected = activeDevice?.id === item.id;
          const signal = getSignalQuality(item.rssi);
          const isOfficial =
            item.isCompatible ||
            item.name?.toLowerCase().includes('ecos') ||
            item.name?.toLowerCase().includes('band');

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.deviceSelectRow,
                isSelected && styles.deviceSelectRowActive,
              ]}
              onPress={() => onSelectDevice(item)}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.deviceRowLeft}>
                <View
                  style={[
                    styles.deviceIconWrap,
                    isSelected && styles.deviceIconWrapActive,
                  ]}
                >
                  {isOfficial ? (
                    <WatchIcon
                      size={20}
                      color={isSelected ? '#0F766E' : '#64748B'}
                    />
                  ) : (
                    <BluetoothIcon
                      size={18}
                      color={isSelected ? '#0F766E' : '#64748B'}
                    />
                  )}
                </View>

                <View style={styles.deviceTextCol}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        styles.deviceItemName,
                        isSelected && styles.deviceItemNameActive,
                      ]}
                    >
                      {item.name ?? 'Ecos Band'}
                    </Text>
                    {isOfficial && (
                      <View style={styles.compatibleBadge}>
                        <Text style={styles.compatibleBadgeText}>OFICIAL</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.signalRow}>
                    <SignalIcon size={12} color={signal.color} />
                    <Text style={[styles.signalText, { color: signal.color }]}>
                      {signal.label}
                    </Text>
                    <Text style={styles.idSubtext}>
                      · ID: {item.id.slice(0, 10)}...
                    </Text>
                  </View>
                </View>
              </View>

              {/* Selection Radio Circle */}
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterActive,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Handshake & Slider for the Selected Device */}
      {activeDevice && (
        <View style={styles.handshakeBox}>
          <View style={styles.handshakeHeader}>
            <View style={styles.handshakeInfoCol}>
              <Text style={styles.handshakeTag}>Pulsera seleccionada:</Text>
              <Text style={styles.handshakeDeviceName}>
                {activeDevice.name ?? 'Ecos Band'}
              </Text>
              <Text style={styles.handshakeSignalText}>
                {activeSignal.label}
              </Text>
            </View>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>LISTA PARA ENLAZAR</Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <SwipeToConnect
              onConfirm={() => onConnect(activeDevice)}
              isConnecting={isThisConnecting}
              disabled={isConnecting}
            />
          </View>
        </View>
      )}
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
  sliderContainer: {
    width: '100%',
    paddingTop: 2,
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
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionHeaderRow: {
    gap: 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  devicesList: {
    gap: 8,
  },
  deviceSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  deviceSelectRowActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  deviceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  deviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.small,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconWrapActive: {
    backgroundColor: '#DCFCE7',
  },
  deviceTextCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceItemName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text,
  },
  deviceItemNameActive: {
    color: '#14532D',
    fontWeight: '700',
  },
  idSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#10B981',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  handshakeBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: 2,
  },
  handshakeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  handshakeInfoCol: {
    gap: 2,
    flex: 1,
  },
  handshakeTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  handshakeDeviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14532D',
  },
  handshakeSignalText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#059669',
  },
  readyBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  readyBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
