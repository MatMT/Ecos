import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  BluetoothIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  ShieldCheckIcon,
  SignalIcon,
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

function getSignalQuality(rssi?: number | null): { label: string; color: string } {
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

function getStatusBadgeInfo(
  status: BleConnectionStatus,
  isDemoMode: boolean,
  hasBonded?: boolean
): { text: string; bg: string; color: string; dot: string } {
  if (status === 'connected') {
    return {
      text: 'Sincronizada',
      bg: '#DCFCE7',
      color: '#15803D',
      dot: '#16A34A',
    };
  }
  if (status === 'connecting') {
    return {
      text: hasBonded ? 'Reconectando automáticamente...' : 'Enlazando pulsera...',
      bg: '#FEF3C7',
      color: '#92400E',
      dot: '#F59E0B',
    };
  }
  if (isDemoMode) {
    return {
      text: 'Modo Demostración Activo',
      bg: '#E0F2FE',
      color: '#0369A1',
      dot: '#0284C7',
    };
  }
  switch (status) {
    case 'scanning':
      return {
        text: 'Buscando dispositivos...',
        bg: '#FEF3C7',
        color: '#92400E',
        dot: '#F59E0B',
      };
    case 'error':
      return {
        text: 'Sin conexión',
        bg: '#FEE2E2',
        color: '#B91C1C',
        dot: '#DC2626',
      };
    case 'idle':
    case 'disconnected':
    default:
      return {
        text: hasBonded ? 'Esperando señal de ESP32...' : 'Lista para enlazar',
        bg: '#F1F5F9',
        color: '#64748B',
        dot: '#94A3B8',
      };
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
    bondedDeviceId,
    startScanOnly,
    stopScan,
    connectToDeviceId,
    unpair,
    openSettings,
  } = useEsp32Ble();

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [isTechDetailsOpen, setIsTechDetailsOpen] = useState(false);

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

  // Radar ripple animations when scanning (using useState to satisfy React 19 ref rules)
  const [waveAnim1] = useState(() => new Animated.Value(0));
  const [waveAnim2] = useState(() => new Animated.Value(0));
  const [waveAnim3] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isScanning) {
      const createLoop = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const loop1 = createLoop(waveAnim1, 0);
      const loop2 = createLoop(waveAnim2, 600);
      const loop3 = createLoop(waveAnim3, 1200);

      loop1.start();
      loop2.start();
      loop3.start();

      return () => {
        loop1.stop();
        loop2.stop();
        loop3.stop();
        waveAnim1.setValue(0);
        waveAnim2.setValue(0);
        waveAnim3.setValue(0);
      };
    } else {
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      waveAnim3.setValue(0);
    }
  }, [isScanning, waveAnim1, waveAnim2, waveAnim3]);

  const handleConnectDevice = async (device: ScannedDevice) => {
    setConnectingId(device.id);
    try {
      await connectToDeviceId(device.id);
    } finally {
      setConnectingId(null);
    }
  };

  const statusBadge = getStatusBadgeInfo(status, isDemoMode, Boolean(bondedDeviceId));

  // Filter out Ecos Band / primary device from generic list
  const primaryDevice = discoveredDevices.find(
    (item) =>
      item.isCompatible ||
      item.name?.toLowerCase().includes('ecos') ||
      item.name?.toLowerCase().includes('band')
  );

  const secondaryDevices = discoveredDevices.filter(
    (item) => item.id !== primaryDevice?.id
  );

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
        {isDemoMode && (
          <TouchableOpacity
            style={styles.headerDemoBadge}
            onPress={() => router.push('/settings' as Href)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ir a ajustes de simulación"
          >
            <Text style={styles.headerDemoText}>Demo Activa</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION: Commercial Wearable Presentation */}
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
                color={
                  isConnected ? '#0F766E' : isScanning ? Colors.brand : '#64748B'
                }
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
          <Text style={styles.heroTitle}>Ecos Band</Text>

          <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusBadge.dot }]}
            />
            <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
              {statusBadge.text}
            </Text>
          </View>

          {/* Friendly Guidance Copy */}
          <Text style={styles.heroSubtitle}>
            {isConnected
              ? 'Tu pulsera está enlazada y transmitiendo datos biométricos en tiempo real.'
              : isConnecting && bondedDeviceId
              ? 'Reconectando automáticamente con tu Ecos Band. Si reiniciaste el ESP32, se enlazará en unos segundos.'
              : isScanning
              ? 'Buscando tu pulsera Ecos Band... Mantenla a menos de 1 metro de tu teléfono.'
              : isConnecting
              ? 'Sincronizando canales seguros con la pulsera...'
              : bondedDeviceId
              ? 'Pulsera previamente enlazada. Se conectará automáticamente al detectar la señal de tu ESP32.'
              : isDemoMode
              ? 'Transmitiendo telemetría continua bajo simulación fisiológica.'
              : 'Asegúrate de que tu pulsera esté encendida y cerca de tu teléfono para sincronizar tu ritmo y descanso.'}
          </Text>

          {/* Primary Action Button */}
          <View style={styles.heroActionContainer}>
            {isConnected ? (
              <Button
                label="Desvincular pulsera"
                variant="danger"
                onPress={() => void unpair()}
              />
            ) : isConnecting && bondedDeviceId ? (
              <Button
                label="Desvincular pulsera"
                variant="danger"
                onPress={() => void unpair()}
              />
            ) : isScanning ? (
              <Button
                label="Detener búsqueda"
                variant="danger"
                onPress={stopScan}
              />
            ) : bondedDeviceId ? (
              <View style={styles.bondedActionCol}>
                <Button
                  label="Reconectar ahora"
                  variant="primary"
                  disabled={isConnecting}
                  onPress={() => void connectToDeviceId(bondedDeviceId)}
                />
                <TouchableOpacity
                  style={styles.unpairLinkBtn}
                  onPress={() => void unpair()}
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
                onPress={() => void startScanOnly()}
              />
            )}
          </View>
        </View>

        {/* RICH CONNECTED STATE DETAILS */}
        {isConnected && (
          <View style={styles.card}>
            <View style={styles.connectedHeaderRow}>
              <View style={styles.connectedIconBox}>
                <BluetoothIcon size={20} color="#0D9488" />
              </View>
              <View style={styles.connectedInfoCol}>
                <Text style={styles.connectedDeviceTitle}>
                  {connectedDeviceName ?? 'Ecos Band'}
                </Text>
                <Text style={styles.connectedDeviceSubtitle}>
                  Enlace de baja energía (BLE) activo
                </Text>
              </View>
              <View style={styles.liveTag}>
                <Text style={styles.liveTagText}>En vivo</Text>
              </View>
            </View>

            {/* Battery / Power Supply Status */}
            <View style={styles.batterySection}>
              <View style={styles.batteryLabelRow}>
                <View style={styles.batteryLeftInfo}>
                  <BatteryChargingIcon size={16} color="#15803D" />
                  <Text style={styles.batteryLabel}>Alimentación</Text>
                </View>
                <View style={styles.batteryStatusPill}>
                  <Text style={styles.batteryStatusPillText}>100% · Corriente</Text>
                </View>
              </View>
              <View style={styles.batteryTrack}>
                <View style={[styles.batteryFill, { width: '100%' }]} />
              </View>
              <Text style={styles.batterySubtext}>
                Conectado a la corriente con alimentación continua activa.
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
        )}

        {/* DEMO MODE SCENARIO BANNER */}
        {isDemoMode && !isConnected && (
          <View style={styles.demoCard}>
            <View style={styles.demoCardLeft}>
              <Text style={styles.demoCardLabel}>Escenario de simulación:</Text>
              <Text style={styles.demoCardValue}>
                {getScenarioLabel(preferences.simulationScenario)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.demoConfigButton}
              onPress={() => router.push('/settings' as Href)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Modificar escenario en ajustes"
            >
              <Text style={styles.demoConfigButtonText}>Ajustes →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* HARDWARE ERROR ALERT */}
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

        {/* STATE 3: FOUND COMPATIBLE DEVICE (ELEVATED HERO CARD) */}
        {!isConnected && !bondedDeviceId && primaryDevice && (
          <View style={styles.discoveredPrimaryCard}>
            <View style={styles.discoveredPrimaryHeader}>
              <View style={styles.primaryDeviceIconBox}>
                <WatchIcon size={22} color="#0F766E" />
              </View>
              <View style={styles.primaryDeviceInfo}>
                <View style={styles.primaryNameRow}>
                  <Text style={styles.primaryDeviceTitle}>Ecos Band</Text>
                  <View style={styles.compatibleBadge}>
                    <Text style={styles.compatibleBadgeText}>DISPOSITIVO OFICIAL</Text>
                  </View>
                </View>
                <View style={styles.signalRow}>
                  <SignalIcon
                    size={14}
                    color={getSignalQuality(primaryDevice.rssi).color}
                  />
                  <Text
                    style={[
                      styles.signalText,
                      { color: getSignalQuality(primaryDevice.rssi).color },
                    ]}
                  >
                    {getSignalQuality(primaryDevice.rssi).label}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryConnectBtn}
              onPress={() => void handleConnectDevice(primaryDevice)}
              disabled={isConnecting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Vincular con la pulsera Ecos Band"
            >
              {isConnecting && connectingId === primaryDevice.id ? (
                <View style={styles.btnRowLoading}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.primaryConnectBtnText}>Enlazando...</Text>
                </View>
              ) : (
                <Text style={styles.primaryConnectBtnText}>Vincular ahora</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* SECONDARY DISCOVERED DEVICES (IF ANY) */}
        {!isConnected && !bondedDeviceId && secondaryDevices.length > 0 && (
          <View style={styles.secondaryDevicesContainer}>
            <Text style={styles.secondaryDevicesHeading}>
              Otros dispositivos detectados ({secondaryDevices.length})
            </Text>
            {secondaryDevices.map((item) => {
              const isThisConnecting = isConnecting && connectingId === item.id;
              return (
                <View key={item.id} style={styles.secondaryDeviceItem}>
                  <View style={styles.secondaryDeviceLeft}>
                    <BluetoothIcon size={16} color="#64748B" />
                    <View style={styles.secondaryDeviceTextWrap}>
                      <Text style={styles.secondaryDeviceName}>
                        {item.name ?? 'Dispositivo BLE'}
                      </Text>
                      <Text style={styles.secondaryDeviceSub}>
                        {item.rssi != null ? `${item.rssi} dBm · ` : ''}
                        ID: {item.id.slice(0, 14)}...
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.secondaryConnectBtn}
                    onPress={() => void handleConnectDevice(item)}
                    disabled={isConnecting}
                    activeOpacity={0.8}
                  >
                    {isThisConnecting ? (
                      <ActivityIndicator size="small" color={Colors.brand} />
                    ) : (
                      <Text style={styles.secondaryConnectBtnText}>Conectar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* REAL-TIME TELEMETRY METRICS SECTION */}
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
                  {isConnected ? 'Hardware Físico' : 'Modo Demostración'}
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

        {/* PROGRESSIVE DISCLOSURE: COLLAPSIBLE TECHNICAL SPECIFICATIONS */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setIsTechDetailsOpen((prev) => !prev)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Desplegar detalles técnicos y diagnóstico"
          >
            <View style={styles.accordionTitleRow}>
              <InfoIcon size={16} color={Colors.textSecondary} />
              <Text style={styles.accordionTitle}>
                Detalles técnicos y diagnóstico
              </Text>
            </View>
            {isTechDetailsOpen ? (
              <ChevronUpIcon size={16} color={Colors.textSecondary} />
            ) : (
              <ChevronDownIcon size={16} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>

          {isTechDetailsOpen && (
            <View style={styles.accordionContent}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Dispositivo:</Text>
                <Text style={styles.specValue}>
                  Ecos Band (Sensor biométrico fisiológico)
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Frecuencia de telemetría:</Text>
                <Text style={styles.specValue}>1000 ms (1 Hz)</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Protocolo de enlace:</Text>
                <Text style={styles.specValue}>
                  BLE GATT con notificación activa en tiempo real
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Trama de datos:</Text>
                <Text style={styles.specValue}>
                  Estructura binaria empaquetada de 6 bytes (BPM, SpO2, Actividad, Flags)
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Servicios GATT:</Text>
                <Text style={styles.specValue}>
                  Heart Rate Service (UUID 0x180D) y Servicio de Telemetría Propietario
                </Text>
              </View>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingRight: Spacing.two,
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
  headerDemoBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.small,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  headerDemoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 48,
  },

  /* HERO CARD & RADAR ANIMATION */
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radarContainer: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  radarWave: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: Colors.brand,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
  },
  wearableDisc: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  wearableDiscConnected: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  wearableDiscScanning: {
    borderColor: Colors.brand,
  },
  connectedBadgeIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    paddingHorizontal: 10,
    borderRadius: Radius.large,
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
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
    marginBottom: Spacing.three,
  },
  heroActionContainer: {
    width: '100%',
    paddingTop: Spacing.two,
  },
  bondedActionCol: {
    width: '100%',
    gap: 8,
  },
  unpairLinkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  unpairLinkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },

  /* CONNECTED CARD */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  connectedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedInfoCol: {
    flex: 1,
  },
  connectedDeviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  connectedDeviceSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  liveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  batterySection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  batteryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  batteryLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  batteryLabel: {
    fontSize: 13,
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
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  batterySubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  sensorStatusBox: {
    paddingTop: 10,
    gap: 8,
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
    backgroundColor: '#16A34A',
  },
  sensorText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },

  /* FOUND PRIMARY DEVICE CARD */
  discoveredPrimaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  discoveredPrimaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryDeviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDeviceInfo: {
    flex: 1,
  },
  primaryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  primaryDeviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532D',
  },
  compatibleBadge: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compatibleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '600',
  },
  primaryConnectBtn: {
    backgroundColor: '#0F766E',
    borderRadius: Radius.medium,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRowLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryConnectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* SECONDARY DEVICES */
  secondaryDevicesContainer: {
    gap: Spacing.two,
  },
  secondaryDevicesHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  secondaryDeviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryDeviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  secondaryDeviceTextWrap: {
    flex: 1,
  },
  secondaryDeviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  secondaryDeviceSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  secondaryConnectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.small,
    backgroundColor: '#E2E8F0',
  },
  secondaryConnectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },

  /* DEMO CARD */
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: Radius.large,
    padding: Spacing.three,
  },
  demoCardLeft: {
    flex: 1,
  },
  demoCardLabel: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  demoCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C4A6E',
    marginTop: 2,
  },
  demoConfigButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.small,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  demoConfigButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },

  /* ERROR CARD */
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

  /* SECTION & METRICS */
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

  /* PROGRESSIVE DISCLOSURE ACCORDION */
  accordionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    backgroundColor: '#F8FAFC',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  accordionContent: {
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
    backgroundColor: Colors.surface,
  },
  specItem: {
    flexDirection: 'column',
    gap: 2,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  specValue: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
  },
});
