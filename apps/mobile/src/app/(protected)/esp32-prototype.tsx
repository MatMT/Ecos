import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useEsp32Ble, type BleConnectionStatus } from '@/hooks/use-esp32-ble';

function getStatusLabel(status: BleConnectionStatus): string {
  switch (status) {
    case 'idle':
      return 'Listo para sincronizar';
    case 'scanning':
      return 'Buscando dispositivo ESP32...';
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
    startScanAndConnect,
    disconnect,
  } = useEsp32Ble();

  const isScanningOrConnecting = status === 'scanning' || status === 'connecting';
  const isConnected = status === 'connected';

  const displayBpm = isConnected && bpm > 0 ? bpm : rawAdcValue > 0 ? Math.round(45 + (rawAdcValue / 4095) * (190 - 45)) : 0;
  const displayActivity = isConnected ? activityLevel : percentage;

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
              Dispositivo: {connectedDeviceName}
            </Text>
          )}
        </View>

        {errorMessage && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Hardware Alert Banner */}
        {isConnected && hardwareAlert && (
          <View style={styles.alertCard}>
            <Text style={styles.alertCardTitle}>¡Alerta Autonómica Activa!</Text>
            <Text style={styles.alertCardText}>
              Desacople fisiológico detectado: Ritmo cardíaco acelerado en estado de reposo muscular.
            </Text>
          </View>
        )}

        {isConnected && sosPressed && (
          <View style={styles.alertCard}>
            <Text style={styles.alertCardTitle}>¡Botón de Emergencia Pulsado!</Text>
            <Text style={styles.alertCardText}>
              Se ha recibido señal de auxilio desde el dispositivo periférico.
            </Text>
          </View>
        )}

        {/* Live Potentiometer 1: Heart Rate (BPM) */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>RITMO CARDÍACO · POTENCIÓMETRO 1 (GPIO 34)</Text>
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
          <Text style={styles.cardSubtitle}>NIVEL DE ACTIVIDAD · POTENCIÓMETRO 2 (GPIO 35)</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, displayActivity))}%` }]} />
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
            <Text style={styles.miniValue}>{isConnected ? `${spo2}%` : '--'}</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Pasos Acumulados</Text>
            <Text style={styles.miniValue}>{isConnected ? stepDelta : '--'}</Text>
          </View>
        </View>

        {/* Technical Specs Card */}
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>DETALLES TÉCNICOS DEL ENLACE</Text>
          <Text style={styles.infoRow}>Entradas: GPIO 34 (BPM) | GPIO 35 (Actividad)</Text>
          <Text style={styles.infoRow}>Frecuencia de telemetría: 1000 ms (1 Hz)</Text>
          <Text style={styles.infoRow}>Perfil: GATT con Notificación Activa (6 bytes)</Text>
          {lowBattery && (
            <Text style={[styles.infoRow, { color: Colors.danger }]}>
              Estado de batería: Nivel bajo
            </Text>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.actionsContainer}>
          {!isConnected ? (
            <Button
              label={isScanningOrConnecting ? 'Buscando ESP32...' : 'Escanear y Conectar'}
              onPress={() => void startScanAndConnect()}
              disabled={isScanningOrConnecting}
              loading={isScanningOrConnecting}
            />
          ) : (
            <Button
              label="Desconectar Dispositivo"
              variant="danger"
              onPress={() => void disconnect()}
            />
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
    color: Colors.textSecondary,
    marginTop: Spacing.two,
  },
  errorCard: {
    backgroundColor: Colors.dangerSurface,
    borderColor: Colors.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.small,
    padding: Spacing.three,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
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
  actionsContainer: {
    marginTop: Spacing.two,
  },
});
