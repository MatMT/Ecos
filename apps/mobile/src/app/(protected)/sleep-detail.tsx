import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Radius } from '@/constants/theme';
import {
  ArrowLeftIcon,
  BedIcon,
  BookOpenIcon,
  CheckIcon,
  CoffeeIcon,
  MoonIcon,
  SmartphoneOffIcon,
  SunIcon,
  WindIcon,
} from '@/components/ui/app-icons';
import { useStudent } from '@/hooks/use-student';
import { useTheme } from '@/context/theme-context';
import { studentClient } from '@/services/api/student-client';

interface DailySleepRecord {
  dayName: string;
  dateStr: string;
  hours: number;
  bedtime: string;
  wakeTime: string;
}

const DEFAULT_WEEKLY_RECORDS: DailySleepRecord[] = [
  { dayName: 'Lunes', dateStr: '18 sep', hours: 7.2, bedtime: '23:15', wakeTime: '06:30' },
  { dayName: 'Martes', dateStr: '19 sep', hours: 8.4, bedtime: '22:45', wakeTime: '07:10' },
  { dayName: 'Miércoles', dateStr: '20 sep', hours: 6.5, bedtime: '00:10', wakeTime: '06:40' },
  { dayName: 'Jueves', dateStr: '21 sep', hours: 8.1, bedtime: '23:00', wakeTime: '07:05' },
  { dayName: 'Viernes', dateStr: '22 sep', hours: 7.0, bedtime: '23:30', wakeTime: '06:30' },
  { dayName: 'Sábado', dateStr: '23 sep', hours: 8.5, bedtime: '00:00', wakeTime: '08:30' },
  { dayName: 'Domingo', dateStr: '24 sep', hours: 7.7, bedtime: '23:20', wakeTime: '07:00' },
];

const GOAL_OPTIONS = [6, 7, 8, 9];

const SLEEP_HYGIENE_TIPS = [
  {
    id: 'circadian',
    title: 'Constancia de ritmo',
    description: 'Procura acostarte y levantarte en una ventana similar para sincronizar tu reloj circadiano.',
    Icon: MoonIcon,
    bgColor: '#F0F9FF',
    iconColor: '#0284C7',
  },
  {
    id: 'screens',
    title: 'Desconexión digital',
    description: 'Aleja las pantallas 30 minutos antes de dormir; la luz azul inhibe la síntesis de melatonina.',
    Icon: SmartphoneOffIcon,
    bgColor: '#F1F5F9',
    iconColor: '#475569',
  },
  {
    id: 'caffeine',
    title: 'Ventana de cafeína',
    description: 'Evita café, bebidas energéticas o té estimulante al menos 6 horas antes de tu descanso.',
    Icon: CoffeeIcon,
    bgColor: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: 'temp',
    title: 'Temperatura y ventilación',
    description: 'Un ambiente fresco (18°C a 20°C) facilita la reducción fisiológica del pulso nocturno.',
    Icon: WindIcon,
    bgColor: '#F0FDFA',
    iconColor: '#0D9488',
  },
  {
    id: 'mind',
    title: 'Desaceleración mental',
    description: 'Dedica 10 minutos a una lectura ligera en papel o ejercicios de respiración suave.',
    Icon: BookOpenIcon,
    bgColor: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    id: 'sun',
    title: 'Luz matutina natural',
    description: 'Recibir luz solar en los primeros 20 minutos tras despertar afianza tu energía diurna.',
    Icon: SunIcon,
    bgColor: '#FEF9C3',
    iconColor: '#CA8A04',
  },
];

export default function SleepDetailScreen() {
  const router = useRouter();
  const { student, preferences, updatePreferences } = useStudent();
  const { colors } = useTheme();

  const currentGoal = preferences.sleepGoalHours || 8;
  const [weeklyRecords, setWeeklyRecords] = useState<DailySleepRecord[]>(DEFAULT_WEEKLY_RECORDS);
  const [activeTipIndex, setActiveTipIndex] = useState<number>(0);

  useEffect(() => {
    if (!student?.id) return;
    studentClient
      .getBiometricTrends(student.id)
      .then((trends) => {
        if (trends && trends.length > 0) {
          const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const mapped: DailySleepRecord[] = trends.slice(-7).map((t) => {
            const d = new Date(t.date);
            const hoursVal = t.avgSleepQualityHours
              ? Number(t.avgSleepQualityHours.toFixed(1))
              : 7.0;
            const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            return {
              dayName: daysMap[d.getDay()],
              dateStr,
              hours: hoursVal,
              bedtime: '23:15',
              wakeTime: '06:45',
            };
          });
          if (mapped.length > 0) {
            setWeeklyRecords(mapped);
          }
        }
      })
      .catch(() => {});
  }, [student?.id]);

  const handleSelectGoal = (hours: number) => {
    void updatePreferences({ sleepGoalHours: hours });
  };

  const handleTipScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const width = e.nativeEvent.layoutMeasurement.width;
    if (width > 0) {
      const idx = Math.round(offsetX / width);
      setActiveTipIndex(idx);
    }
  };

  const totalHours = weeklyRecords.reduce((acc, cur) => acc + cur.hours, 0);
  const avgHours = Number((totalHours / weeklyRecords.length).toFixed(1));
  const daysMetGoal = weeklyRecords.filter((r) => r.hours >= currentGoal).length;

  const screenWidth = Dimensions.get('window').width;
  const tipCardWidth = Math.max(270, screenWidth - 72);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header con retroceso */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
        >
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalle de Descanso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Configurador Interactivo de Meta */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircleTeal, { backgroundColor: colors.brandLight }]}>
              <BedIcon size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Meta Diaria de Descanso</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Ajusta tu objetivo para adaptar el seguimiento de tu bienestar.
              </Text>
            </View>
          </View>

          {/* Selector de Horas de Meta */}
          <View style={styles.goalPillsRow}>
            {GOAL_OPTIONS.map((hours) => {
              const isSelected = currentGoal === hours;
              return (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.goalPill,
                    { borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                    isSelected && [styles.goalPillActive, { backgroundColor: colors.brand, borderColor: colors.brand }],
                  ]}
                  onPress={() => handleSelectGoal(hours)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Fijar meta de ${hours} horas diarias`}
                >
                  <Text
                    style={[
                      styles.goalPillNumber,
                      { color: colors.text },
                      isSelected && styles.goalPillNumberActive,
                    ]}
                  >
                    {hours}h
                  </Text>
                  <Text
                    style={[
                      styles.goalPillLabel,
                      { color: colors.textSecondary },
                      isSelected && styles.goalPillLabelActive,
                    ]}
                  >
                    {isSelected ? 'Actual' : 'Meta'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card 2: Resumen Semanal No Punitivo */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryMetricItem}>
            <Text style={[styles.summaryMetricLabel, { color: colors.textSecondary }]}>PROMEDIO SEMANAL</Text>
            <Text style={[styles.summaryMetricValue, { color: colors.text }]}>
              {avgHours} <Text style={[styles.summaryMetricUnit, { color: colors.textSecondary }]}>hrs</Text>
            </Text>
            <Text style={[styles.summaryMetricSub, { color: colors.textSecondary }]}>
              Promedio semanal: {avgHours}h · Meta sugerida: {currentGoal}h
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryMetricItem}>
            <Text style={[styles.summaryMetricLabel, { color: colors.textSecondary }]}>NOCHES REPARADORAS</Text>
            <Text style={[styles.summaryMetricValue, { color: colors.text }]}>
              {daysMetGoal} <Text style={[styles.summaryMetricUnit, { color: colors.textSecondary }]}>de {weeklyRecords.length}</Text>
            </Text>
            <Text style={[styles.summaryMetricSub, { color: colors.textSecondary }]}>
              Meta personal de {currentGoal}h
            </Text>
          </View>
        </View>

        {/* Card 3: Consejos de Higiene del Sueño (Carrusel Superior Swipeable) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONSEJOS DE HIGIENE DEL SUEÑO</Text>
        <View style={[styles.tipsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleTipScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.tipsCarouselContent}
          >
            {SLEEP_HYGIENE_TIPS.map((tip) => {
              const TipIconComponent = tip.Icon;
              return (
                <View
                  key={tip.id}
                  style={[styles.tipSlide, { width: tipCardWidth }]}
                >
                  <View style={styles.tipSlideHeader}>
                    <View style={[styles.tipSlideIconCircle, { backgroundColor: tip.bgColor }]}>
                      <TipIconComponent size={20} color={tip.iconColor} strokeWidth={2.2} />
                    </View>
                    <Text style={[styles.tipSlideTitle, { color: colors.text }]}>
                      {tip.title}
                    </Text>
                  </View>
                  <Text style={[styles.tipSlideBody, { color: colors.textSecondary }]}>
                    {tip.description}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Indicador de Páginas (Dots) */}
          <View style={styles.tipDotsRow}>
            {SLEEP_HYGIENE_TIPS.map((tip, idx) => (
              <View
                key={tip.id}
                style={[
                  styles.tipDot,
                  { backgroundColor: colors.border },
                  activeTipIndex === idx && [styles.tipDotActive, { backgroundColor: colors.brand }],
                ]}
              />
            ))}
          </View>
        </View>

        {/* Card 4: Desglose de los Últimos 7 Días */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DESGLOSE DE LOS ÚLTIMOS 7 DÍAS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {weeklyRecords.map((item, index) => {
            const isTargetMet = item.hours >= currentGoal;
            return (
              <React.Fragment key={item.dayName + index}>
                {index > 0 && <View style={[styles.itemDivider, { backgroundColor: colors.borderSubtle }]} />}
                <View style={styles.recordRow}>
                  <View style={styles.recordLeftCol}>
                    <Text style={[styles.recordDayName, { color: colors.text }]}>{item.dayName}</Text>
                    <Text style={[styles.recordDateText, { color: colors.textMuted }]}>{item.dateStr}</Text>
                  </View>

                  <View style={styles.recordMidCol}>
                    <Text style={[styles.recordHoursText, { color: colors.text }]}>
                      {item.hours} <Text style={[styles.recordHoursUnit, { color: colors.textSecondary }]}>hrs</Text>
                    </Text>
                    <Text style={[styles.recordTimeRange, { color: colors.textMuted }]}>
                      {item.bedtime} – {item.wakeTime}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.recordBadge,
                      isTargetMet ? styles.recordBadgeSuccess : styles.recordBadgeMuted,
                    ]}
                  >
                    {isTargetMet ? (
                      <CheckIcon size={12} color="#15803D" strokeWidth={3} />
                    ) : null}
                    <Text
                      style={[
                        styles.recordBadgeText,
                        isTargetMet ? styles.recordBadgeTextSuccess : styles.recordBadgeTextMuted,
                      ]}
                    >
                      {isTargetMet ? 'Descanso pleno' : 'Descanso breve'}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    borderRadius: Radius.pill,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircleTeal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
  goalPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.small,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  goalPillNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  goalPillNumberActive: {
    color: '#FFFFFF',
  },
  goalPillLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  goalPillLabelActive: {
    color: '#CCFBF1',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryMetricItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  summaryMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  summaryMetricUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  summaryMetricSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 4,
    marginLeft: 2,
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.medium,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tipsCarouselContent: {
    gap: 12,
  },
  tipSlide: {
    padding: 14,
    borderRadius: Radius.small,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipSlideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipSlideIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipSlideTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  tipSlideBody: {
    fontSize: 12.5,
    color: '#526E65',
    lineHeight: 18,
  },
  tipDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  tipDotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  recordLeftCol: {
    flex: 1,
  },
  recordDayName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordDateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  recordMidCol: {
    flex: 1.2,
    alignItems: 'flex-start',
  },
  recordHoursText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordHoursUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  recordTimeRange: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  recordBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  recordBadgeMuted: {
    backgroundColor: '#F1F5F9',
  },
  recordBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordBadgeTextSuccess: {
    color: '#15803D',
  },
  recordBadgeTextMuted: {
    color: '#64748B',
  },
});
