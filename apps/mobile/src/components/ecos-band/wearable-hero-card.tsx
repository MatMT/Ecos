import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { CheckCircle2Icon, WatchIcon } from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface WearableHeroCardProps {
  isConnected: boolean;
  isConnecting: boolean;
  isScanning: boolean;
  isDemoMode: boolean;
  bondedDeviceId: string | null;
  connectedDeviceName: string | null;
  primaryDeviceDetected: boolean;
  statusBadge: { text: string; bg: string; color: string; dot: string };
  waveAnim1: Animated.Value;
  waveAnim2: Animated.Value;
  waveAnim3: Animated.Value;
  onStartScan: () => void;
  onStopScan: () => void;
  onReconnect: (deviceId: string) => void;
  onOpenUnpairModal: () => void;
}

export function WearableHeroCard({
  isConnected,
  isConnecting,
  isScanning,
  isDemoMode,
  bondedDeviceId,
  connectedDeviceName,
  primaryDeviceDetected,
  statusBadge,
  waveAnim1,
  waveAnim2,
  waveAnim3,
  onStartScan,
  onStopScan,
  onReconnect,
  onOpenUnpairModal,
}: WearableHeroCardProps) {
  const getHeroSubtitle = () => {
    if (isConnected) {
      return 'Tu pulsera está sincronizada y transmitiendo datos biométricos en tiempo real.';
    }
    if (isConnecting && bondedDeviceId) {
      return 'Reconectando automáticamente con tu Ecos Band. Si reiniciaste el ESP32, se enlazará en unos segundos.';
    }
    if (isScanning && primaryDeviceDetected) {
      return 'Dispositivos detectados en el listado inferior. Selecciona tu pulsera y desliza para vincular.';
    }
    if (isScanning) {
      return 'Buscando tu pulsera Ecos Band... Mantenla a menos de 1 metro de tu teléfono.';
    }
    if (isConnecting) {
      return 'Sincronizando canales seguros con la pulsera...';
    }
    if (bondedDeviceId) {
      return 'Pulsera previamente enlazada. Se conectará automáticamente al detectar la señal de tu ESP32.';
    }
    if (isDemoMode) {
      return 'Transmitiendo telemetría continua bajo simulación fisiológica.';
    }
    return 'Asegúrate de que tu pulsera esté encendida y cerca de tu teléfono para sincronizar tu ritmo y descanso.';
  };

  const getHeroTitle = () => {
    if (isConnected) {
      return connectedDeviceName ?? 'Ecos Band';
    }
    if (isScanning && primaryDeviceDetected) {
      return 'Búsqueda activa';
    }
    return 'Ecos Band';
  };

  return (
    <View style={styles.heroCard}>
      <View style={styles.radarContainer}>
        {/* Animated Radar Ripples */}
        {isScanning && (
          <>
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [
                    {
                      scale: waveAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.3],
                      }),
                    },
                  ],
                  opacity: waveAnim1.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0.6, 0.3, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [
                    {
                      scale: waveAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.3],
                      }),
                    },
                  ],
                  opacity: waveAnim2.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0.6, 0.3, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [
                    {
                      scale: waveAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.3],
                      }),
                    },
                  ],
                  opacity: waveAnim3.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0.6, 0.3, 0],
                  }),
                },
              ]}
            />
          </>
        )}

        {/* Central Wearable Disc */}
        <View
          style={[
            styles.wearableDisc,
            isConnected && styles.wearableDiscConnected,
            isScanning && styles.wearableDiscScanning,
          ]}
        >
          <WatchIcon
            size={46}
            color={isConnected ? '#0F766E' : isScanning ? Colors.brand : '#64748B'}
            strokeWidth={1.8}
          />
          {isConnected && (
            <View style={styles.connectedBadgeIcon}>
              <CheckCircle2Icon size={20} color="#15803D" />
            </View>
          )}
        </View>
      </View>

      {/* Device Title & Status Pill */}
      <Text style={styles.heroTitle}>{getHeroTitle()}</Text>

      <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: statusBadge.dot }]} />
        <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
          {statusBadge.text}
        </Text>
      </View>

      {/* Friendly Guidance Copy */}
      <Text style={styles.heroSubtitle}>{getHeroSubtitle()}</Text>

      {/* Action Button: Placed cleanly at bottom of card */}
      <View style={styles.heroActionContainer}>
        {isConnected ? (
          <Button
            label="Desvincular pulsera"
            variant="danger"
            onPress={onOpenUnpairModal}
          />
        ) : isConnecting && bondedDeviceId ? (
          <Button
            label="Desvincular pulsera"
            variant="danger"
            onPress={onOpenUnpairModal}
          />
        ) : isScanning ? (
          <Button
            label="Detener búsqueda"
            variant="danger"
            onPress={onStopScan}
          />
        ) : bondedDeviceId ? (
          <View style={styles.bondedActionCol}>
            <Button
              label="Reconectar ahora"
              variant="primary"
              disabled={isConnecting}
              onPress={() => onReconnect(bondedDeviceId)}
            />
            <TouchableOpacity
              style={styles.unpairLinkBtn}
              onPress={onOpenUnpairModal}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Desvincular pulsera actual"
            >
              <Text style={styles.unpairLinkBtnText}>Desvincular pulsera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            label="Buscar mi Ecos Band"
            variant="primary"
            disabled={isConnecting}
            onPress={onStartScan}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.three,
  },
  radarContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  radarWave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
  },
  wearableDisc: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  wearableDiscConnected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 2.5,
  },
  wearableDiscScanning: {
    backgroundColor: '#F0FDFA',
    borderColor: Colors.brand,
  },
  connectedBadgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.two,
    maxWidth: 320,
  },
  heroActionContainer: {
    width: '100%',
    marginTop: Spacing.one,
  },
  bondedActionCol: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  unpairLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  unpairLinkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
});
