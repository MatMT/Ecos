import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import CustomTopBar from '@/components/custom-top-bar';
import { MetricCard } from '@/components/ui/metric-card';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';
import { useTodayLabel } from '@/hooks/use-today-label';

function greetingNameFrom(email: string | undefined): string {
  if (!email) return 'Usuario';
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export default function Home() {
  const { user } = useAuth();
  const todayLabel = useTodayLabel();
  const { bpm, stress, analysis } = useBiometricMonitor();

  const aiMessage = analysis?.isAnomaly
    ? 'Detectamos signos de estrés elevado. ¿Quieres respirar un momento?'
    : 'Tu estado se percibe estable en este momento.';

  return (
    <View style={styles.mainContainer}>
      <CustomTopBar name={greetingNameFrom(user?.email)} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu bienestar hoy</Text>
          <Text style={styles.subtitle}>{todayLabel}</Text>
        </View>

        <View style={styles.aiCard}>
          <Text style={styles.aiTag}>● ESTADO ACTUAL • IA</Text>
          <Text style={styles.aiText}>&quot;{aiMessage}&quot;</Text>
          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>Iniciar Respiración</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <MetricCard
              label="Ritmo Cardíaco"
              value={bpm != null ? String(bpm) : '--'}
              unit="bpm"
              status={bpm != null && bpm > 100 ? 'elevated' : 'normal'}
            />
            <MetricCard
              label="Nivel de Estrés"
              value={stress != null ? String(stress) : '--'}
              unit="%"
              status={stress != null && stress > 40 ? 'high' : 'normal'}
            />
          </View>
          <View style={styles.gridRow}>
            {/* TODO: no oxygen/temperature sensor data source yet — wire these up once the
                device integration exposes them, same as bpm/stress via useBiometricMonitor. */}
            <MetricCard label="Oxígeno" value="95" unit="%" />
            <MetricCard label="Temperatura" value="37.2" unit="°C" />
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tendencia de Estrés</Text>
          <View style={styles.mockChart}>
            <Text style={styles.placeholderText}>[ Gráfico de Línea Aquí ]</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ATENCIÓN PRIORITARIA</Text>
        <TouchableOpacity style={styles.panicButton}>
          <View style={styles.panicLeft}>
            <View style={styles.panicIconPlaceholder} />
            <View>
              <Text style={styles.panicText}>Botón de Pánico</Text>
              <Text style={styles.panicSubtext}>Contactar a su psicólogo asignado</Text>
            </View>
          </View>
          <Text style={styles.arrowIcon}>&gt;</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  aiTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.status.normal,
    marginBottom: 10,
  },
  aiText: {
    fontSize: 19,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 15,
  },
  aiButton: {
    backgroundColor: Colors.brandDark,
    borderRadius: Radius.large,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  gridContainer: {
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: 20,
    marginBottom: 25,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  mockChart: {
    height: 150,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 1,
  },
  panicButton: {
    backgroundColor: Colors.dangerSurface,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: Radius.medium,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panicIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.danger,
    marginRight: 12,
  },
  panicText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  panicSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  arrowIcon: {
    fontSize: 18,
    color: Colors.textMuted,
  },
});
