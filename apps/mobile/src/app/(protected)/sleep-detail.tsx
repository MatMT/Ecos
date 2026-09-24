import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Radius } from '@/constants/theme';
import {
  ArrowLeftIcon,
  BedIcon,
  CheckIcon,
  LeafIcon,
  MoonIcon,
} from '@/components/ui/app-icons';
import { useStudent } from '@/hooks/use-student';
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

export default function SleepDetailScreen() {
  const router = useRouter();
  const { student, preferences, updatePreferences } = useStudent();

  const currentGoal = preferences.sleepGoalHours || 8;
  const [weeklyRecords, setWeeklyRecords] = useState<DailySleepRecord[]>(DEFAULT_WEEKLY_RECORDS);

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

  const totalHours = weeklyRecords.reduce((acc, cur) => acc + cur.hours, 0);
  const avgHours = Number((totalHours / weeklyRecords.length).toFixed(1));
  const daysMetGoal = weeklyRecords.filter((r) => r.hours >= currentGoal).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header con retroceso */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
        >
          <ArrowLeftIcon size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Descanso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Configurador Interactivo de Meta */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleTeal}>
              <BedIcon size={20} color="#0F766E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Meta Diaria de Descanso</Text>
              <Text style={styles.cardSubtitle}>
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
                    isSelected && styles.goalPillActive,
                  ]}
                  onPress={() => handleSelectGoal(hours)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Fijar meta de ${hours} horas diarias`}
                >
                  <Text
                    style={[
                      styles.goalPillNumber,
                      isSelected && styles.goalPillNumberActive,
                    ]}
                  >
                    {hours}h
                  </Text>
                  <Text
                    style={[
                      styles.goalPillLabel,
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

        {/* Card 2: Resumen Semanal de Rendimiento */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryMetricItem}>
            <Text style={styles.summaryMetricLabel}>PROMEDIO SEMANAL</Text>
            <Text style={styles.summaryMetricValue}>{avgHours} <Text style={styles.summaryMetricUnit}>hrs</Text></Text>
            <Text style={styles.summaryMetricSub}>
              {avgHours >= currentGoal ? '✅ Meta superada' : '⚠️ Por debajo de meta'}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryMetricItem}>
            <Text style={styles.summaryMetricLabel}>DÍAS CUMPLIDOS</Text>
            <Text style={styles.summaryMetricValue}>
              {daysMetGoal} <Text style={styles.summaryMetricUnit}>/ {weeklyRecords.length}</Text>
            </Text>
            <Text style={styles.summaryMetricSub}>
              Meta de {currentGoal}h al día
            </Text>
          </View>
        </View>

        {/* Card 3: Desglose Día por Día */}
        <Text style={styles.sectionTitle}>DESGLOSE DE LOS ÚLTIMOS 7 DÍAS</Text>
        <View style={styles.card}>
          {weeklyRecords.map((item, index) => {
            const isTargetMet = item.hours >= currentGoal;
            return (
              <React.Fragment key={item.dayName + index}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.recordRow}>
                  <View style={styles.recordLeftCol}>
                    <Text style={styles.recordDayName}>{item.dayName}</Text>
                    <Text style={styles.recordDateText}>{item.dateStr}</Text>
                  </View>

                  <View style={styles.recordMidCol}>
                    <Text style={styles.recordHoursText}>
                      {item.hours} <Text style={styles.recordHoursUnit}>hrs</Text>
                    </Text>
                    <Text style={styles.recordTimeRange}>
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
                      {isTargetMet ? 'Cumplido' : 'Ligero'}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Card 4: Consejos de Higiene del Sueño */}
        <Text style={styles.sectionTitle}>CONSEJOS DE HIGIENE DEL SUEÑO</Text>
        <View style={styles.tipsCard}>
          <View style={styles.tipItem}>
            <View style={[styles.tipIconWrap, { backgroundColor: '#F0FDFA' }]}>
              <LeafIcon size={18} color="#0D9488" />
            </View>
            <View style={styles.tipTextWrap}>
              <Text style={styles.tipTitle}>Desconexión de pantallas</Text>
              <Text style={styles.tipBody}>
                Procura apagar dispositivos 30 minutos antes de dormir para permitir que la melatonina regule tu ritmo de descanso.
              </Text>
            </View>
          </View>

          <View style={styles.itemDivider} />

          <View style={styles.tipItem}>
            <View style={[styles.tipIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <MoonIcon size={18} color="#2563EB" />
            </View>
            <View style={styles.tipTextWrap}>
              <Text style={styles.tipTitle}>Constancia en el horario</Text>
              <Text style={styles.tipBody}>
                Acostarte y levantarte en ventanas similares estabiliza la variabilidad de tu frecuencia cardíaca (VFC).
              </Text>
            </View>
          </View>
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
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  goalPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.medium,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
    elevation: 2,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  goalPillNumber: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
  },
  goalPillNumberActive: {
    color: '#FFFFFF',
  },
  goalPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalPillLabelActive: {
    color: '#CCFBF1',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  summaryMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  summaryMetricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  summaryMetricUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryMetricSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  recordLeftCol: {
    width: '32%',
  },
  recordDayName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  recordDateText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  recordMidCol: {
    flex: 1,
    alignItems: 'center',
  },
  recordHoursText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  recordHoursUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  recordTimeRange: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.pill,
    width: 82,
    justifyContent: 'center',
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
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
});
