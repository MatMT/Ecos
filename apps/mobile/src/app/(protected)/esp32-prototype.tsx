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
import { useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/button';
import {
  ActivityIcon,
  BatteryChargingIcon,
  BatteryIcon,
  ShieldCheckIcon,
  WatchIcon,
} from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  useEsp32Ble,
  type BleConnectionStatus,
  type ScannedDevice,
} from '@/hooks/use-esp32-ble';
import { useStudent, type SimulationScenario } from '@/hooks/use-student';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';

function getScenarioLabel(scenario: SimulationScenario | undefined): string {
  switch (scenario) {
    case 'work_stress':
      return 'Tensión Laboral / Académica';
    case 'panic_attack':
      return 'Ataque de Pánico / Desacople';
    case 'physical_exercise':
      return 'Ejercicio Físico / Caminata';
    case 'resting':
    default:
      return 'Reposo y Calma';
  }
}

function getStatusLabel(
  status: BleConnectionStatus,
  isDemoMode: boolean
): string {
  if (status === 'connected') {
    return 'Ecos Band conectada en vivo';
  }
  if (isDemoMode) {
    return 'Modo demostración activo';
  }
  switch (status) {
    case 'scanning':
      return 'Buscando pulseras Ecos Band...';
    case 'connecting':
      return 'Estableciendo enlace Bluetooth...';
    case 'error':
      return 'Error de comunicación';
    case 'idle':
    case 'disconnected':
    default:
      return 'Pulsera desconectada';
  }
}

function getStatusColor(
  status: BleConnectionStatus,
  isDemoMode: boolean
): string {
  if (status === 'connected') {
    return Colors.status.normal;
  }
  if (isDemoMode) {
    return '#0284C7';
  }
  switch (status) {
    case 'scanning':
    case 'connecting':
      return Colors.status.elevated;
    case 'error':
      return Colors.danger;
    case 'idle':
    case 'disconnected':
    default:
      return '#94A3B8';
  }
}

export default function Esp32PrototypeScreen() {
  const router = useRouter();
  const { preferences } = useStudent();
  const {
    bpm: monitorBpm,
    spo2: monitorSpo2,
    activity: monitorActivity,
    trafficState,
  } = useBiometricMonitor();

  const {
    status,
    bpm: bleBpm,
    activityLevel: bleActivity,
    spo2: bleSpo2,
    hardwareAlert: bleHardwareAlert,
    sosPressed: bleSosPressed,
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
  const isDemoMode = preferences.demoMode;

  const isDataActive = isConnected || isDemoMode;
  const activeBpm = isConnected ? (bleBpm > 0 ? bleBpm : 74) : (monitorBpm ?? 74);
  const activeActivity = isConnected ? bleActivity : (monitorActivity ?? 0);
  const activeSpo2 = isConnected ? bleSpo2 : (monitorSpo2 ?? 98);
  const hasAlert = isConnected
    ? bleHardwareAlert
    : isDemoMode && trafficState === 'RED';

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
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Volver a la pantalla anterior"
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ecos Band</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Device Hero Card */}
        <View style={styles.card}>
          <View style={styles.deviceHeaderRow}>
            <View style={styles.deviceIconCircle}>
              <WatchIcon size={24} color="#0D9488" />
            </View>
            <View style={styles.deviceHeaderTextWrap}>
              <Text style={styles.deviceMainTitle}>Ecos Band</Text>
              <Text style={styles.deviceSubTitle}>
                {isConnected
                  ? (connectedDeviceName ?? 'Pulsera Enlazada')
                  : isDemoMode
                  ? 'Simulación Lineal Activa'
                  : 'Sin dispositivo enlazado'}
              </Text>
            </View>
            <View
              style={[
                styles.connectionPill,
                {
                  backgroundColor: isConnected
                    ? '#DCFCE7'
                    : isDemoMode
                    ? '#E0F2FE'
                    : '#F1F5F9',
                },
              ]}
            >
              <View
                style={[
                  styles.connectionDot,
                  { backgroundColor: getStatusColor(status, isDemoMode) },
                ]}
              />
              <Text
                style={[
                  styles.connectionPillText,
                  {
                    color: isConnected
                      ? '#15803D'
                      : isDemoMode
                      ? '#0369A1'
                      : '#64748B',
                  },
                ]}
              >
                {getStatusLabel(status, isDemoMode)}
              </Text>
            </View>
          </View>

          {/* Battery / Power Feedback */}
          <View style={styles.powerStatusRow}>
            {isConnected ? (
              <View style={styles.feedbackItem}>
                <BatteryChargingIcon size={16} color="#0D9488" />
                <Text style={styles.feedbackText}>
                  Alimentación: Conectado a la corriente (100%)
                </Text>
              </View>
            ) : isDemoMode ? (
              <View style={styles.feedbackItem}>
                <BatteryChargingIcon size={16} color="#0D9488" />
                <Text style={styles.feedbackText}>
                  Alimentación: Modo Demostración (100%)
                </Text>
              </View>
            ) : (
              <View style={styles.feedbackItem}>
                <BatteryIcon size={16} color="#94A3B8" />
                <Text style={[styles.feedbackText, { color: '#94A3B8' }]}>
                  Batería: Sin conexión
                </Text>
              </View>
            )}
          </View>

          {/* Demo Mode Scenario Indicator & Link to Settings */}
          {isDemoMode && (
            <View style={styles.demoScenarioRow}>
              <View style={styles.demoScenarioInfo}>
                <Text style={styles.demoScenarioLabel}>Escenario Simulado:</Text>
                <Text style={styles.demoScenarioValue}>
                  {getScenarioLabel(preferences.simulationScenario)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.configLinkBtn}
                onPress={() => router.push('/settings' as Href)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cambiar escenario fisiológico en Ajustes"
              >
                <Text style={styles.configLinkBtnText}>Configurar →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Live Telemetry Section */}
        {isDataActive && (
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
                  {isConnected ? 'Hardware Físico' : 'Modo Demo Lineal'}
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

            {/* Secondary Metrics */}
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
        )}

        {/* Bluetooth Pairing & Connection Controls */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>VINCULACIÓN BLUETOOTH</Text>
          {isConnected ? (
            <Button
              label="Desconectar Pulsera Ecos Band"
              variant="danger"
              onPress={() => void disconnect()}
            />
          ) : (
            <>
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
                variant={isScanning ? 'danger' : 'primary'}
              />

              {/* Error Display */}
              {errorMessage && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => void openSettings()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.settingsButtonText}>
                      Abrir Ajustes de Bluetooth
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Discovered Devices List */}
              <View style={styles.devicesHeaderRow}>
                <Text style={styles.devicesCountText}>
                  Dispositivos detectados ({discoveredDevices.length})
                </Text>
                {isScanning && <ActivityIndicator size="small" color={Colors.brand} />}
              </View>

              {discoveredDevices.length === 0 ? (
                <View style={styles.emptyDevicesBox}>
                  <Text style={styles.emptyDevicesText}>
                    {isScanning
                      ? 'Buscando señales de pulseras Ecos Band cercanas...'
                      : 'No hay dispositivos detectados. Asegúrese de que la pulsera esté conectada a la corriente y presione «Escanear Dispositivos BLE».'}
                  </Text>
                </View>
              ) : (
                <View style={styles.devicesList}>
                  {discoveredDevices.map((item) => {
                    const isThisConnecting = isConnecting && connectingId === item.id;
                    const isEcosBand =
                      item.isCompatible ||
                      item.name?.toLowerCase().includes('ecos') ||
                      item.name?.toLowerCase().includes('band');

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.deviceItem,
                          isEcosBand && styles.deviceItemCompatible,
                        ]}
                      >
                        <View style={styles.deviceItemLeft}>
                          <View
                            style={[
                              styles.deviceIconBox,
                              isEcosBand && styles.deviceIconBoxCompatible,
                            ]}
                          >
                            <WatchIcon
                              size={20}
                              color={isEcosBand ? '#0F766E' : '#64748B'}
                            />
                          </View>
                          <View style={styles.deviceInfoTextWrap}>
                            <View style={styles.deviceNameRow}>
                              <Text style={styles.deviceNameText}>
                                {item.name ?? 'Dispositivo BLE'}
                              </Text>
                              {isEcosBand && (
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
                            isEcosBand && styles.connectSmallBtnPrimary,
                          ]}
                          onPress={() => void handleConnectDevice(item)}
                          disabled={isConnecting}
                          activeOpacity={0.8}
                        >
                          {isThisConnecting ? (
                            <ActivityIndicator
                              size="small"
                              color={isEcosBand ? '#FFFFFF' : Colors.brand}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.connectSmallBtnText,
                                isEcosBand && styles.connectSmallBtnTextPrimary,
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
            </>
          )}
        </View>

        {/* Technical Specs Card */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>ESPECIFICACIONES DE LA PULSERA</Text>
          <Text style={styles.infoRow}>
            Dispositivo: Ecos Band (Sensor biométrico fisiológico)
          </Text>
          <Text style={styles.infoRow}>
            Frecuencia de telemetría: 1000 ms (1 Hz)
          </Text>
          <Text style={styles.infoRow}>
            Protocolo: BLE GATT con notificación activa en tiempo real
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingRight: Spacing.three,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brand,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  deviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceHeaderTextWrap: {
    flex: 1,
  },
  deviceMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  deviceSubTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.large,
    gap: 6,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  powerStatusRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  demoScenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  demoScenarioInfo: {
    flex: 1,
  },
  demoScenarioLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  demoScenarioValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand,
    marginTop: 2,
  },
  configLinkBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.small,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  configLinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
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
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  dataSourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  metricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.two,
  },
  metricValue: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.text,
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: Spacing.two,
  },
  rangeLegend: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 5,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentageLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  percentageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  alertCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.large,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertCardContent: {
    flex: 1,
  },
  alertCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  alertCardText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  devicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  devicesCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptyDevicesBox: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDevicesText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  devicesList: {
    gap: Spacing.two,
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  compatibleBadge: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  compatibleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deviceDetailsText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  connectSmallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.small,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectSmallBtnPrimary: {
    backgroundColor: Colors.brand,
  },
  connectSmallBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  connectSmallBtnTextPrimary: {
    color: '#FFFFFF',
  },
  errorCard: {
    backgroundColor: Colors.dangerSurface,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.small,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: 10,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  settingsButton: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
});
