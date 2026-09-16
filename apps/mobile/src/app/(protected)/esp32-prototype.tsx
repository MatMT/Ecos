import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useEsp32Ble, BleConnectionStatus } from '@/hooks/use-esp32-ble';

function getStatusLabel(status: BleConnectionStatus): string {
  switch (status) {
    case 'idle':
      return 'Listo para sincronizar';
    case 'scanning':
      return 'Buscando dispositivo...';
    case 'connecting':
      return 'Estableciendo conexión...';
    case 'connected':
      return 'Dispositivo conectado';
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
    rawAdcValue,
    percentage,
    connectedDeviceName,
    errorMessage,
    startScanAndConnect,
    disconnect,
  } = useEsp32Ble();

  const isScanningOrConnecting = status === 'scanning' || status === 'connecting';
  const isConnected = status === 'connected';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Regresar">
          <Text style={styles.backButtonText}>← Regresar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prototipo de Hardware</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>ESTADO DE CONEXIÓN BLE</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(status) },
              ]}
            />
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
            {isScanningOrConnecting && (
              <ActivityIndicator
                size="small"
                color={Colors.brand}
                style={styles.statusLoader}
              />
            )}
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

        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>LECTURA ANALÓGICA DEL POTENCIÓMETRO</Text>
          <View style={styles.metricContainer}>
            <Text style={styles.metricValue}>{rawAdcValue}</Text>
            <Text style={styles.metricUnit}>/ 4095 (12 bits)</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${percentage}%` }]} />
          </View>

          <View style={styles.percentageRow}>
            <Text style={styles.percentageLabel}>Nivel de apertura</Text>
            <Text style={styles.percentageValue}>{percentage}%</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>DETALLES TÉCNICOS</Text>
          <Text style={styles.infoRow}>Entrada: GPIO 34 (ADC1)</Text>
          <Text style={styles.infoRow}>Frecuencia: 100 ms (10 Hz)</Text>
          <Text style={styles.infoRow}>Perfil: GATT con Notificación Activa</Text>
        </View>

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
  statusLoader: {
    marginLeft: Spacing.two,
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
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.three,
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
  infoRow: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.one,
  },
  actionsContainer: {
    marginTop: Spacing.two,
  },
});
