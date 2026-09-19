import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Svg, {
  Line,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import CustomTopBar from '@/components/custom-top-bar';
import { MetricCard } from '@/components/ui/metric-card';
import { Colors, Radius } from '@/constants/theme';
import {
  AlertShieldIcon,
  BedIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LeafIcon,
  WatchIcon,
} from '@/components/ui/app-icons';
import { useAuth } from '@/hooks/use-auth';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';
import { useTodayLabel } from '@/hooks/use-today-label';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DailySleepData {
  day: string;
  hours: number;
}

const WEEKLY_SLEEP_DATA: DailySleepData[] = [
  { day: 'L', hours: 7.2 },
  { day: 'M', hours: 6.5 },
  { day: 'M', hours: 7.8 },
  { day: 'J', hours: 8.1 },
  { day: 'V', hours: 7.0 },
  { day: 'S', hours: 8.5 },
  { day: 'D', hours: 7.7 },
];

function greetingNameFrom(email: string | undefined): string {
  if (!email) return 'Usuario';
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const todayLabel = useTodayLabel();
  const {
    bpm,
    stress,
    activity,
    isBleConnected,
    trafficState,
  } = useBiometricMonitor();

  const [showMetrics, setShowMetrics] = useState<boolean>(false);

  const toggleMetrics = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowMetrics((prev) => !prev);
  };

  // Dynamic AI Triage messaging
  const getAiMessage = () => {
    switch (trafficState) {
      case 'RED':
        return 'Tu pulso se encuentra significativamente elevado en reposo. Te recomendamos pausar tus actividades y buscar apoyo.';
      case 'YELLOW':
        return 'Detectamos una leve aceleración en tu pulso sin movimiento activo. ¿Quieres respirar un momento?';
      case 'GREEN':
      default:
        return 'Tu ritmo se mantiene sereno y estable. Excelente momento para concentrarte en tus actividades.';
    }
  };

  const getAiBannerColor = () => {
    switch (trafficState) {
      case 'RED':
        return {
          tag: '● ESTADO CRÍTICO · IA',
          color: Colors.danger,
          bg: Colors.dangerSurface,
        };
      case 'YELLOW':
        return {
          tag: '● ATENCIÓN PREVENTIVA · IA',
          color: '#EAB308',
          bg: '#FEF9C3',
        };
      case 'GREEN':
      default:
        return {
          tag: '● ESTADO ACTUAL · IA',
          color: Colors.status.normal,
          bg: Colors.surface,
        };
    }
  };

  const banner = getAiBannerColor();

  return (
    <View style={styles.mainContainer}>
      <CustomTopBar name={greetingNameFrom(user?.email)} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Tu bienestar hoy</Text>
              <Text style={styles.subtitle}>{todayLabel}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/esp32-prototype' as Href)}
              activeOpacity={0.7}
              style={[
                styles.blePill,
                { backgroundColor: isBleConnected ? '#DCFCE7' : '#F1F5F9' },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ver estado y diagnóstico de la pulsera ECOS BAND"
            >
              <View
                style={[
                  styles.bleDot,
                  { backgroundColor: isBleConnected ? '#16A34A' : '#94A3B8' },
                ]}
              />
              <Text
                style={[
                  styles.bleText,
                  { color: isBleConnected ? '#15803D' : '#64748B' },
                ]}
              >
                {isBleConnected ? 'ECOS BAND' : 'Modo Demo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic AI Banner */}
        <View style={[styles.aiCard, { backgroundColor: banner.bg }]}>
          <Text style={[styles.aiTag, { color: banner.color }]}>
            {banner.tag}
          </Text>
          <Text style={styles.aiText}>&quot;{getAiMessage()}&quot;</Text>
        </View>

        {/* Acciones Rápidas (Inmediatas arriba del pliegue) */}
        <Text style={styles.sectionHeaderLabel}>ACCIONES RÁPIDAS</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionBreathingButton}
            onPress={() => router.push('/modals/breathing-guide' as Href)}
            activeOpacity={0.85}
          >
            <View style={styles.actionBreathingIconWrap}>
              <LeafIcon size={20} color="#0F766E" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionBreathingTitle}>Iniciar Respiración</Text>
              <Text style={styles.actionBreathingSubtitle}>Guía de calma de 3 min</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionSosButton}
            onPress={() => router.push('/modals/panic-alert' as Href)}
            activeOpacity={0.85}
          >
            <View style={styles.actionSosIconWrap}>
              <AlertShieldIcon size={18} color="#DC2626" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionSosTitle}>Pedir Ayuda</Text>
              <Text style={styles.actionSosSubtitle}>SOS / Alerta</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Biometría del Momento: Collapsible Accordion */}
        <Text style={styles.sectionHeaderLabel}>BIOMETRÍA DEL MOMENTO</Text>
        <TouchableOpacity
          style={styles.accordionHeaderCard}
          onPress={toggleMetrics}
          activeOpacity={0.8}
        >
          <View style={styles.accordionLeft}>
            <View style={styles.accordionIconCircle}>
              <WatchIcon size={20} color="#475569" />
            </View>
            <View style={styles.accordionTextContainer}>
              <Text style={styles.accordionTitle}>
                ECOS BAND · {trafficState === 'RED' ? 'Ritmo acelerado' : trafficState === 'YELLOW' ? 'Atención preventiva' : 'Fisiología en balance'}
              </Text>
              <Text style={styles.accordionSubtitle}>
                {isBleConnected
                  ? showMetrics
                    ? 'Telemetría en vivo desde ESP32'
                    : 'Pulso y actividad en tiempo real'
                  : showMetrics
                  ? '4 lecturas sincronizadas'
                  : 'Pulso y actividad sincronizados'}
              </Text>
            </View>
          </View>
          <View style={styles.accordionChevronBadge}>
            <Text style={styles.accordionChevronText}>
              {showMetrics ? 'Ocultar' : 'Ver métricas'}
            </Text>
            {showMetrics ? (
              <ChevronUpIcon size={12} color={Colors.brand} />
            ) : (
              <ChevronDownIcon size={12} color={Colors.brand} />
            )}
          </View>
        </TouchableOpacity>

        {/* 2x2 Grid (Visible only on demand to prevent hypervigilance) */}
        {showMetrics && (
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <MetricCard
                label="Ritmo Cardíaco"
                value={bpm != null ? String(bpm) : '--'}
                unit="bpm"
                status={
                  bpm != null
                    ? bpm > 120
                      ? 'high'
                      : bpm > 95
                      ? 'elevated'
                      : 'normal'
                    : 'normal'
                }
              />
              <MetricCard
                label="Nivel de Actividad"
                value={activity != null ? String(activity) : '0'}
                unit="%"
                status={activity != null && activity > 60 ? 'normal' : undefined}
              />
            </View>
            <View style={styles.gridRow}>
              <MetricCard
                label="Calidad de Sueño"
                value="7.8"
                unit="h"
                status="normal"
              />
              <MetricCard
                label="Nivel de Estrés"
                value={stress != null ? String(stress) : '--'}
                unit="%"
                status={
                  stress != null
                    ? stress > 65
                      ? 'high'
                      : stress > 35
                      ? 'elevated'
                      : 'normal'
                    : 'normal'
                }
              />
            </View>
          </View>
        )}

        {/* Monitoreo de Sueño y Descanso (Diseño armonizado con Ecos) */}
        <Text style={styles.sectionHeaderLabel}>MONITOREO DE SUEÑO Y DESCANSO</Text>
        <View style={styles.sleepCard}>
          {/* Header row with Bed Icon Circle, Title and Quality Badge */}
          <View style={styles.sleepHeader}>
            <View style={styles.sleepTitleGroup}>
              <View style={styles.sleepIconCircle}>
                <BedIcon size={18} color="#0F766E" />
              </View>
              <View>
                <Text style={styles.sleepTitle}>Sueño y Descanso</Text>
                <Text style={styles.sleepSubLabel}>Últimos 7 días</Text>
              </View>
            </View>
            <View style={styles.sleepQualityBadge}>
              <Text style={styles.sleepQualityBadgeText}>7.7h · Reparador</Text>
            </View>
          </View>

          {/* Headline */}
          <Text style={styles.sleepHeadline}>
            En los últimos 7 días, tu promedio de descanso ha sido de 7 h 42 min.
          </Text>

          {/* Chart & stats area with continuous horizontal reference line */}
          <View style={styles.sleepChartFullWrapper}>
            <Svg width="100%" height={120} viewBox="0 0 320 120">
              {/* Bars on the right half */}
              {WEEKLY_SLEEP_DATA.map((item, index) => {
                const barWidth = 14;
                const startX = 148;
                const spacing = (172 - barWidth * 7) / 6;
                const x = startX + index * (barWidth + spacing);
                const maxH = 65;
                const height = (item.hours / 10) * maxH;
                const y = 88 - height;
                const isToday = index === WEEKLY_SLEEP_DATA.length - 1;

                return (
                  <React.Fragment key={item.day + index}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx={5}
                      fill={isToday ? '#0D9488' : '#CBD5E1'}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y="108"
                      fill={isToday ? '#0D9488' : '#64748B'}
                      fontSize="11"
                      fontWeight={isToday ? '700' : '600'}
                      textAnchor="middle"
                    >
                      {item.day}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Continuous horizontal reference line cutting across the entire card */}
              <Line
                x1="0"
                y1="40"
                x2="320"
                y2="40"
                stroke="#0D9488"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Svg>

            {/* Left Overlay for Text & Readout */}
            <View style={styles.sleepLeftOverlay} pointerEvents="none">
              <View style={styles.sleepLabelArea}>
                <Text style={styles.sleepAverageSubLabel}>PROMEDIO</Text>
                <Text style={styles.sleepAverageLabel}>Tiempo Dormido</Text>
              </View>
              <View style={styles.sleepTimeRow}>
                <Text style={styles.sleepBigNumber}>7</Text>
                <Text style={styles.sleepBigUnit}>hr </Text>
                <Text style={styles.sleepBigNumber}>42</Text>
                <Text style={styles.sleepBigUnit}>min</Text>
              </View>
            </View>
          </View>
        </View>
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
    paddingTop: 30,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  blePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.large,
    gap: 6,
  },
  bleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  bleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiCard: {
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
    marginBottom: 10,
  },
  aiText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 15,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBreathingButton: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    borderWidth: 1.5,
    borderColor: '#A7E3DC',
    borderRadius: Radius.large,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  actionBreathingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBreathingIcon: {
    fontSize: 18,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionBreathingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#134E48',
  },
  actionBreathingSubtitle: {
    fontSize: 11,
    color: '#14B8A6',
    marginTop: 2,
    fontWeight: '500',
  },
  actionSosButton: {
    flex: 0.35,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: Radius.large,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  actionSosIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSosIcon: {
    fontSize: 16,
  },
  actionSosTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionSosSubtitle: {
    fontSize: 10,
    color: '#991B1B',
    marginTop: 2,
    fontWeight: '600',
  },
  accordionHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.large,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accordionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionIconText: {
    fontSize: 18,
  },
  accordionTextContainer: {
    flex: 1,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  accordionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accordionChevronBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accordionChevronText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand,
  },
  gridContainer: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sleepCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: 18,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sleepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sleepTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sleepIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sleepSubLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  sleepQualityBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  sleepQualityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  sleepHeadline: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 21,
    marginBottom: 16,
  },
  sleepChartFullWrapper: {
    position: 'relative',
    height: 120,
    width: '100%',
  },
  sleepLeftOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 145,
    justifyContent: 'flex-start',
  },
  sleepLabelArea: {
    height: 38,
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  sleepAverageSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  sleepAverageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 16,
  },
  sleepTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  sleepBigNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  sleepBigUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 4,
  },
});
