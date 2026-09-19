import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { WatchIcon } from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  useEsp32Ble,
  type BleConnectionStatus,
  type ScannedDevice,
} from '@/hooks/use-esp32-ble';

function getStatusLabel(status: BleConnectionStatus): string {
  switch (status) {
    case 'idle':
      return 'Listo para sincronizar';
    case 'scanning':
      return 'Buscando dispositivos Bluetooth...';
    case 'connecting':
      return 'Estableciendo conexión...';
    case 'connected':
      return 'Dispositivo conectado en vivo';
    case 'disconnected':
      return 'Dispositivo desconectado';
    case 'error':
      return 'Error de comunicación';
  }
}

function getStatusColor(status: BleConnectionStatus): string {
  switch (status) {
    case 'connected':
      return Colors.status.normal;
    case 'scanning':
    case 'connecting':
      return Colors.status.elevated;
    case 'error':
      return Colors.danger;
    case 'idle':
    case 'disconnected':
    default:
      return Colors.textSecondary;
  }
}

export default function Esp32PrototypeScreen() {
  const router = useRouter();
  const {
    status,
    bpm,
    activityLevel,
    spo2,
    stepDelta,
    hardwareAlert,
    sosPressed,
    lowBattery,
    rawAdcValue,
    percentage,
    connectedDeviceName,
    errorMessage,
    discoveredDevices,
    startScanOnly,
    stopScan,
    connectToDeviceId,
    disconnect,
    openSettings,
  } = useEsp32Ble();

  const [connectingId, setConnectingId] = useState<string | null>(null);

  const isScanning = status === 'scanning';
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  const displayBpm =
    isConnected && bpm > 0
      ? bpm
      : rawAdcValue > 0
      ? Math.round(45 + (rawAdcValue / 4095) * (190 - 45))
      : 0;
  const displayActivity = isConnected ? activityLevel : percentage;

  const handleConnectDevice = async (device: ScannedDevice) => {
    setConnectingId(device.id);
    try {
      await connectToDeviceId(device.id);
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver a la pantalla anterior"
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prototipo ESP32 BLE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(status) },
              ]}
            />
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>

          {connectedDeviceName && (
            <Text style={styles.deviceLabel}>
              Dispositivo enlazado: {connectedDeviceName}
            </Text>
          )}

          <View style={styles.scanActionsRow}>
            {!isConnected ? (
              <Button
                label={isScanning ? 'Detener Búsqueda' : 'Escanear Dispositivos BLE'}
                onPress={() => {
                  if (isScanning) {
                    stopScan();
                  } else {
                    void startScanOnly();
                  }
                }}
                disabled={isConnecting}
                loading={isScanning}
                variant={isScanning ? 'danger' : 'primary'}
              />
            ) : (
              <Button
                label="Desconectar Dispositivo"
                variant="danger"
                onPress={() => void disconnect()}
              />
            )}
          </View>
        </View>

        {/* Error Card with Settings shortcut */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => void openSettings()}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsButtonText}>
                Abrir Ajustes de Bluetooth en iPhone
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Native Discovered Devices List */}
        {!isConnected && (
          <View style={styles.card}>
            <View style={styles.devicesHeaderRow}>
              <Text style={styles.cardSubtitle}>
                DISPOSITIVOS BLUETOOTH DISPONIBLES ({discoveredDevices.length})
              </Text>
              {isScanning && (
                <ActivityIndicator size="small" color={Colors.brand} />
              )}
            </View>

            {discoveredDevices.length === 0 ? (
              <View style={styles.emptyDevicesBox}>
                <Text style={styles.emptyDevicesText}>
                  {isScanning
                    ? 'Buscando señales de radio BLE en el entorno...'
                    : 'No hay dispositivos detectados. Presione «Escanear Dispositivos BLE» para iniciar el escaneo.'}
                </Text>
              </View>
            ) : (
              <View style={styles.devicesList}>
                {discoveredDevices.map((item) => {
                  const isThisConnecting =
                    isConnecting && connectingId === item.id;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.deviceItem,
                        item.isCompatible && styles.deviceItemCompatible,
                      ]}
                    >
                      <View style={styles.deviceItemLeft}>
                        <View
                          style={[
                            styles.deviceIconBox,
                            item.isCompatible && styles.deviceIconBoxCompatible,
                          ]}
                        >
                          <WatchIcon
                            size={20}
                            color={item.isCompatible ? '#0F766E' : '#64748B'}
                          />
                        </View>
                        <View style={styles.deviceInfoTextWrap}>
                          <View style={styles.deviceNameRow}>
                            <Text style={styles.deviceNameText}>
                              {item.name ?? 'Dispositivo BLE (Sin Nombre)'}
                            </Text>
                            {item.isCompatible && (
                              <View style={styles.compatibleBadge}>
                                <Text style={styles.compatibleBadgeText}>
                                  ECOS BAND
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.deviceDetailsText}>
                            {item.rssi != null ? `Señal: ${item.rssi} dBm · ` : ''}
                            ID: {item.id.slice(0, 16)}...
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.connectSmallBtn,
                          item.isCompatible && styles.connectSmallBtnPrimary,
                        ]}
                        onPress={() => void handleConnectDevice(item)}
                        disabled={isConnecting}
                        activeOpacity={0.8}
                      >
                        {isThisConnecting ? (
                          <ActivityIndicator
                            size="small"
                            color={item.isCompatible ? '#FFFFFF' : Colors.brand}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.connectSmallBtnText,
                              item.isCompatible && styles.connectSmallBtnTextPrimary,
                            ]}
                          >
                            Conectar
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Live Hardware Telemetry Section */}
        {isConnected && (
          <>
            {/* Hardware Alert Banner */}
            {hardwareAlert && (
              <View style={styles.alertCard}>
                <Text style={styles.alertCardTitle}>¡Alerta Autonómica Activa!</Text>
                <Text style={styles.alertCardText}>
                  Desacople fisiológico detectado: Ritmo cardíaco acelerado en estado de reposo muscular.
                </Text>
              </View>
            )}

            {sosPressed && (
              <View style={styles.alertCard}>
                <Text style={styles.alertCardTitle}>¡Botón de Emergencia Pulsado!</Text>
                <Text style={styles.alertCardText}>
                  Se ha recibido señal de auxilio desde el dispositivo periférico.
                </Text>
              </View>
            )}

            {/* Live Potentiometer 1: Heart Rate (BPM) */}
            <View style={styles.card}>
              <Text style={styles.cardSubtitle}>
                RITMO CARDÍACO · POTENCIÓMETRO 1 (GPIO 34)
              </Text>
              <View style={styles.metricContainer}>
                <Text style={styles.metricValue}>
                  {displayBpm > 0 ? displayBpm : '--'}
                </Text>
                <Text style={styles.metricUnit}>BPM</Text>
              </View>
              <Text style={styles.rangeLegend}>Rango calibrado: 45 - 190 BPM</Text>
            </View>

            {/* Live Potentiometer 2: Physical Activity (%) */}
            <View style={styles.card}>
              <Text style={styles.cardSubtitle}>
                NIVEL DE ACTIVIDAD · POTENCIÓMETRO 2 (GPIO 35)
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(100, Math.max(0, displayActivity))}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.percentageRow}>
                <Text style={styles.percentageLabel}>Intensidad corporal</Text>
                <Text style={styles.percentageValue}>{displayActivity}%</Text>
              </View>
            </View>

            {/* Secondary Telemetry Grid */}
            <View style={styles.telemetryGrid}>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Oxigenación (SpO2)</Text>
                <Text style={styles.miniValue}>{`${spo2}%`}</Text>
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Pasos Acumulados</Text>
                <Text style={styles.miniValue}>{stepDelta}</Text>
              </View>
            </View>
          </>
        )}

        {/* Technical Specs Card */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>DETALLES TÉCNICOS DEL ENLACE</Text>
          <Text style={styles.infoRow}>
            Entradas: GPIO 34 (BPM) | GPIO 35 (Actividad)
          </Text>
          <Text style={styles.infoRow}>Frecuencia de telemetría: 1000 ms (1 Hz)</Text>
          <Text style={styles.infoRow}>
            Perfil: GATT con Notificación Activa (6 bytes)
          </Text>
          {lowBattery && (
            <Text style={[styles.infoRow, { color: Colors.danger }]}>
              Estado de batería: Nivel bajo
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingRight: Spacing.three,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.brand,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.two,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  deviceLabel: {
    fontSize: 14,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  scanActionsRow: {
    marginTop: Spacing.two,
  },
  errorCard: {
    backgroundColor: Colors.dangerSurface,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.small,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  settingsButton: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  devicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyDevicesBox: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDevicesText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  devicesList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deviceItemCompatible: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  deviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
  },
  deviceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconBoxCompatible: {
    backgroundColor: '#CCFBF1',
  },
  deviceInfoTextWrap: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  deviceNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  compatibleBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  compatibleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  deviceDetailsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  connectSmallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  connectSmallBtnPrimary: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  connectSmallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  connectSmallBtnTextPrimary: {
    color: '#FFFFFF',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  alertCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  alertCardText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.one,
  },
  metricValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
  },
  metricUnit: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: Spacing.two,
  },
  rangeLegend: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 12,
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: Radius.pill,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  percentageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  infoRow: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.one,
  },
});
