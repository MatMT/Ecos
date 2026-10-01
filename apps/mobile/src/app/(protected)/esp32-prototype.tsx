import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';

import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  useEsp32Ble,
  formatBleErrorMessage,
  type BleConnectionStatus,
  type ScannedDevice,
} from '@/hooks/use-esp32-ble';
import { useStudent, type SimulationScenario } from '@/hooks/use-student';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';
import {
  CalmCelebration,
  ConnectedHardwareCard,
  DiscoveredDevicesSection,
  SleepMonitoringCard,
  TechSpecsAccordion,
  TelemetryDashboard,
  UnpairConfirmModal,
  WearableHeroCard,
} from '@/components/ecos-band';

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
  if (status === 'scanning') {
    return {
      text: 'Buscando dispositivos...',
      bg: '#FEF3C7',
      color: '#92400E',
      dot: '#F59E0B',
    };
  }
  if (isDemoMode) {
    return {
      text: 'Modo Simulación Activo',
      bg: '#E0F2FE',
      color: '#0369A1',
      dot: '#0284C7',
    };
  }
  switch (status) {
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
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [showUnpairModal, setShowUnpairModal] = useState<boolean>(false);
  const [isUnpairing, setIsUnpairing] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const isScanning = status === 'scanning';
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';
  const isDemoMode = !isConnected && Boolean(preferences.demoMode);



  const isDataActive = isConnected || isDemoMode;
  const activeBpm = isConnected ? (bleBpm > 0 ? bleBpm : 74) : (monitorBpm ?? 74);
  const activeActivity = isConnected ? bleActivity : (monitorActivity ?? 0);
  const activeSpo2 = isConnected ? bleSpo2 : (monitorSpo2 ?? 98);
  const hasAlert = isConnected
    ? bleHardwareAlert
    : isDemoMode && trafficState === 'RED';

  // Radar ripple animations when scanning
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

  const handleCelebrationFinish = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const handleConnectDevice = async (device: ScannedDevice) => {
    setConnectingId(device.id);
    try {
      await connectToDeviceId(device.id);
      // Instant transition into celebration as soon as device is connected
      setShowCelebration(true);
    } catch {
      // Keep celebration inactive on connection errors
    } finally {
      setConnectingId(null);
    }
  };

  const handleExecuteUnpair = async () => {
    setIsUnpairing(true);
    try {
      setShowUnpairModal(false);
      await unpair();
    } finally {
      setIsUnpairing(false);
    }
  };

  const statusBadge = getStatusBadgeInfo(status, isDemoMode, Boolean(bondedDeviceId));

  // Auto-select preferred device (first compatible or first discovered device)
  const selectedDevice =
    discoveredDevices.find((d) => d.id === selectedDeviceId) ??
    discoveredDevices.find(
      (d) =>
        d.isCompatible ||
        d.name?.toLowerCase().includes('ecos') ||
        d.name?.toLowerCase().includes('band')
    ) ??
    discoveredDevices[0] ??
    null;

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
        {/* 1. DISCOVERED DEVICES: Elevated above search card when devices are found */}
        {!isConnected && !bondedDeviceId && discoveredDevices.length > 0 && (
          <DiscoveredDevicesSection
            devices={discoveredDevices}
            selectedDevice={selectedDevice}
            onSelectDevice={(device) => setSelectedDeviceId(device.id)}
            isConnecting={isConnecting}
            connectingId={connectingId}
            onConnect={(device) => void handleConnectDevice(device)}
          />
        )}

        {/* 2. HERO SECTION: Wearable Status & Radar Scan (Rendered below discovered devices) */}
        {!isConnected && (
          <WearableHeroCard
            isConnected={isConnected}
            isConnecting={isConnecting}
            isScanning={isScanning}
            isDemoMode={isDemoMode}
            bondedDeviceId={bondedDeviceId}
            connectedDeviceName={connectedDeviceName}
            primaryDeviceDetected={discoveredDevices.length > 0}
            statusBadge={statusBadge}
            waveAnim1={waveAnim1}
            waveAnim2={waveAnim2}
            waveAnim3={waveAnim3}
            onStartScan={() => void startScanOnly()}
            onStopScan={stopScan}
            onReconnect={(deviceId) => void connectToDeviceId(deviceId)}
            onOpenUnpairModal={() => setShowUnpairModal(true)}
          />
        )}

        {/* 4. ACTIVE CONNECTED STATE CARDS */}
        {isConnected && (
          <>
            <ConnectedHardwareCard
              connectedDeviceName={connectedDeviceName}
              onUnpair={() => setShowUnpairModal(true)}
            />
            <SleepMonitoringCard />
          </>
        )}

        {/* 5. DEMO MODE SCENARIO BANNER (Hidden when connected or when devices are detected) */}
        {isDemoMode && !isConnected && discoveredDevices.length === 0 && (
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

        {/* 6. HARDWARE ERROR ALERT */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{formatBleErrorMessage(errorMessage)}</Text>
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

        {/* 7. REAL-TIME TELEMETRY METRICS SECTION */}
        {isDataActive && (
          <TelemetryDashboard
            isConnected={isConnected}
            activeBpm={activeBpm}
            activeActivity={activeActivity}
            activeSpo2={activeSpo2}
            trafficState={trafficState}
            hasAlert={hasAlert}
            bleSosPressed={bleSosPressed}
          />
        )}

        {/* 8. PROGRESSIVE DISCLOSURE: COLLAPSIBLE TECHNICAL SPECIFICATIONS */}
        <TechSpecsAccordion />

        {/* 9. DISCREET UNPAIR ACTION AT FOOTER (When connected) */}
        {isConnected && (
          <View style={styles.footerUnpairContainer}>
            <TouchableOpacity
              style={styles.footerUnpairButton}
              onPress={() => setShowUnpairModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Desvincular pulsera"
            >
              <Text style={styles.footerUnpairText}>Desvincular pulsera</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* CALM CELEBRATION OVERLAY */}
      <CalmCelebration
        active={showCelebration}
        onFinish={handleCelebrationFinish}
      />

      {/* 9. MODAL DE CONFIRMACIÓN PARA DESVINCULAR */}
      <UnpairConfirmModal
        visible={showUnpairModal}
        isUnpairing={isUnpairing}
        onConfirm={() => void handleExecuteUnpair()}
        onCancel={() => setShowUnpairModal(false)}
      />
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
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: Spacing.three,
    gap: 8,
  },
  demoCardLeft: {
    flex: 1,
  },
  demoCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoCardValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  demoConfigButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  demoConfigButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  settingsButton: {
    backgroundColor: '#DC2626',
    borderRadius: Radius.medium,
    paddingVertical: 10,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  footerUnpairContainer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerUnpairButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
  footerUnpairText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  scanningNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  scanningNoticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stopScanTextBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.small,
    backgroundColor: '#F1F5F9',
  },
  stopScanTextBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
});
