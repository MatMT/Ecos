import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';

import CustomTopBar from '@/components/custom-top-bar';
import { Colors, Radius } from '@/constants/theme';
import {
  ArrowDownIcon,
  CheckIcon,
  GearIcon,
  LeafIcon,
  MoonIcon,
  StarIcon,
} from '@/components/ui/app-icons';
import { useStudent } from '@/hooks/use-student';
import {
  studentClient,
  type AppointmentItem,
} from '@/services/api/student-client';

type StatsTab = 'biometrics' | 'sessions';

interface WeeklyDataPoint {
  day: string;
  minutesHighStress: number;
}

const DEFAULT_WEEKLY_DATA: WeeklyDataPoint[] = [
  { day: 'L', minutesHighStress: 45 },
  { day: 'M', minutesHighStress: 70 },
  { day: 'M', minutesHighStress: 35 },
  { day: 'J', minutesHighStress: 15 },
  { day: 'V', minutesHighStress: 25 },
  { day: 'S', minutesHighStress: 55 },
  { day: 'D', minutesHighStress: 20 },
];

function formatSessionDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const day = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
  } catch {
    return 'Reciente';
  }
}

export default function Stats() {
  const router = useRouter();
  const { student, displayName } = useStudent();

  const [activeTab, setActiveTab] = useState<StatsTab>('biometrics');
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>(DEFAULT_WEEKLY_DATA);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  useEffect(() => {
    if (!student?.id) return;

    studentClient
      .getBiometricTrends(student.id)
      .then((trends) => {
        if (trends && trends.length > 0) {
          const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
          const mapped: WeeklyDataPoint[] = trends.slice(-7).map((t) => {
            const d = new Date(t.date);
            const stressVal = t.avgStressLevel != null ? Math.round(t.avgStressLevel * 100) : 30;
            return {
              day: dayLabels[d.getDay()],
              minutesHighStress: stressVal,
            };
          });
          if (mapped.length > 0) {
            setWeeklyData(mapped);
          }
        }
      })
      .catch(() => {});

    studentClient
      .getAppointments(student.id)
      .then((items) => {
        if (items && Array.isArray(items)) {
          setAppointments(items);
        }
      })
      .catch(() => {});
  }, [student?.id]);

  const maxBarValue = 80;
  const barChartHeight = 110;

  // Mental Health UX: Paleta moderna, calmante y no punitiva
  const CALM_COLOR = '#86A789'; // Verde Salvia Claro
  const MODERATE_COLOR = '#DFB15B'; // Ámbar Arena Suave
  const TENSION_COLOR = '#E07A5F'; // Coral Suave / Rosa Ceniza

  return (
    <View style={styles.mainContainer}>
      <CustomTopBar name={displayName} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header con enlace discreto a terapeuta */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Tu Evolución</Text>
            <TouchableOpacity
              style={styles.therapistLinkBtn}
              onPress={() => router.push('/profile')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Consultar con terapeuta asignado en perfil"
            >
              <Text style={styles.therapistLinkText}>Consultar terapeuta →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {activeTab === 'biometrics'
              ? 'Análisis longitudinal de tu respuesta fisiológica, patrones de descanso y equilibrio autonómico.'
              : 'Historial de sesiones clínicas, compromisos terapéuticos y metas acordadas con tu terapeuta.'}
          </Text>
        </View>

        {/* Selector Segmentado (Píldoras) */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'biometrics' && styles.segmentButtonActive]}
            onPress={() => setActiveTab('biometrics')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'biometrics' }}
          >
            <LeafIcon size={15} color={activeTab === 'biometrics' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.segmentButtonText, activeTab === 'biometrics' && styles.segmentButtonTextActive]}>
              Biometría y Hábitos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'sessions' && styles.segmentButtonActive]}
            onPress={() => setActiveTab('sessions')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'sessions' }}
          >
            <StarIcon size={15} color={activeTab === 'sessions' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.segmentButtonText, activeTab === 'sessions' && styles.segmentButtonTextActive]}>
              Sesiones y Metas
            </Text>
          </TouchableOpacity>
        </View>

        {/* VISTA 1: BIOMETRÍA Y HÁBITOS */}
        {activeTab === 'biometrics' && (
          <>
            {/* Weekly Histogram Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>FRECUENCIA SEMANAL DE ESTRÉS</Text>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>Tendencia: Favorable</Text>
                  <ArrowDownIcon size={12} color="#15803D" />
                </View>
              </View>
              <Text style={styles.chartCaption}>
                Nivel promedio de tensión diaria con franja de equilibrio adaptativo
              </Text>

              <View style={styles.histogramWrapper}>
                <Svg height="145" width="100%" viewBox="0 0 320 145">
                  {/* Franja horizontal de equilibrio */}
                  <Rect
                    x="4"
                    y="48"
                    width="312"
                    height="40"
                    rx={6}
                    fill={CALM_COLOR}
                    fillOpacity={0.12}
                  />
                  <Line
                    x1="4"
                    y1="68"
                    x2="316"
                    y2="68"
                    stroke={CALM_COLOR}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                  <SvgText
                    x="312"
                    y="44"
                    fill={CALM_COLOR}
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="end"
                  >
                    Rango de equilibrio
                  </SvgText>

                  {weeklyData.map((item, index) => {
                    const barWidth = 26;
                    const spacing = (320 - barWidth * 7) / 8;
                    const x = spacing + index * (barWidth + spacing);
                    const height = Math.min(
                      barChartHeight,
                      (item.minutesHighStress / maxBarValue) * barChartHeight,
                    );
                    const y = 114 - height;

                    // Mental Health UX: Tonos orgánicos y no punitivos
                    const barColor =
                      item.minutesHighStress <= 35
                        ? CALM_COLOR // Verde salvia claro
                        : item.minutesHighStress <= 55
                        ? MODERATE_COLOR // Ámbar arena suave
                        : TENSION_COLOR; // Coral suave / rosa ceniza

                    return (
                      <React.Fragment key={item.day + index}>
                        <Rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx={6}
                          fill={barColor}
                        />
                        <SvgText
                          x={x + barWidth / 2}
                          y="134"
                          fill="#64748B"
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {item.day}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>

                {/* Organic Legend */}
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: CALM_COLOR }]} />
                    <Text style={styles.legendText}>Calma (≤35%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: MODERATE_COLOR }]} />
                    <Text style={styles.legendText}>Moderado (36-55%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: TENSION_COLOR }]} />
                    <Text style={styles.legendText}>Tensión (&gt;55%)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Clinical Correlation Insights (Causa y Efecto) */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>PATRONES Y CORRELACIONES CLÍNICAS</Text>
              <Text style={styles.correlationIntro}>
                Relaciones contextuales observadas entre tus hábitos diarios y tu respuesta autonómica.
              </Text>

              {/* Correlation 1: Sleep vs Stress */}
              <View style={styles.correlationItem}>
                <View style={[styles.correlationIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <MoonIcon size={20} color="#0D9488" />
                </View>
                <View style={styles.correlationTextWrap}>
                  <View style={styles.correlationHeaderRow}>
                    <Text style={styles.correlationTitle}>Impacto del Sueño en tu Estrés</Text>
                    <View style={styles.insightBadge}>
                      <Text style={styles.insightBadgeText}>Sueño vs. Tensión</Text>
                    </View>
                  </View>
                  <Text style={styles.correlationBody}>
                    Los días con menos de 6.5 horas de descanso registraron un 32% más de picos de tensión durante la tarde.
                  </Text>
                  <Text style={styles.correlationTakeaway}>
                    💡 Mantener tu descanso en ≥ 7 horas estabiliza tu umbral de reactividad emocional.
                  </Text>
                </View>
              </View>

              <View style={styles.sessionDivider} />

              {/* Correlation 2: Autonomic Recovery */}
              <View style={styles.correlationItem}>
                <View style={[styles.correlationIconBox, { backgroundColor: '#F0F9FF' }]}>
                  <LeafIcon size={20} color="#0284C7" />
                </View>
                <View style={styles.correlationTextWrap}>
                  <View style={styles.correlationHeaderRow}>
                    <Text style={styles.correlationTitle}>Recuperación Autonómica</Text>
                    <View style={[styles.insightBadge, { backgroundColor: '#E0F2FE' }]}>
                      <Text style={[styles.insightBadgeText, { color: '#0369A1' }]}>Biofeedback</Text>
                    </View>
                  </View>
                  <Text style={styles.correlationBody}>
                    Tu pulso basal promedio descendió 4 lpm en los días que realizaste al menos una sesión de respiración guiada.
                  </Text>
                  <Text style={styles.correlationTakeaway}>
                    💡 Tu sistema parasimpático responde favorablemente a las pausas conscientes.
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* VISTA 2: SESIONES Y METAS */}
        {activeTab === 'sessions' && (
          <>
            {/* Recent Sessions */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>SESIONES CLÍNICAS RECIENTES</Text>
                <View style={[styles.trendBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={[styles.trendText, { color: '#0369A1' }]}>
                    {appointments.length} cita(s)
                  </Text>
                </View>
              </View>

              {appointments.length > 0 ? (
                appointments.slice(0, 4).map((appt, idx) => (
                  <React.Fragment key={appt.id}>
                    {idx > 0 && <View style={styles.sessionDivider} />}
                    <View style={styles.sessionItem}>
                      <View style={styles.sessionIconCircle}>
                        {appt.status === 'completed' ? (
                          <StarIcon size={16} color="#0D9488" />
                        ) : (
                          <GearIcon size={16} color="#0284C7" />
                        )}
                      </View>
                      <View style={styles.sessionDetails}>
                        <Text style={styles.sessionTitle}>
                          {appt.reason || 'Sesión de Acompañamiento Psicológico'}
                        </Text>
                        <Text style={styles.sessionSubtitle}>
                          {formatSessionDate(appt.appointmentDate)} · Estado:{' '}
                          <Text
                            style={{
                              color: appt.status === 'completed' ? '#15803D' : '#0284C7',
                              fontWeight: '600',
                            }}
                          >
                            {appt.status === 'completed' ? 'Completada' : 'Programada'}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))
              ) : (
                <>
                  <View style={styles.sessionItem}>
                    <View style={styles.sessionIconCircle}>
                      <StarIcon size={16} color="#0D9488" />
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionTitle}>Manejo de ansiedad ante evaluaciones</Text>
                      <Text style={styles.sessionSubtitle}>Hace 2 días · 45 min · Acuerdos cumplidos</Text>
                    </View>
                  </View>

                  <View style={styles.sessionDivider} />

                  <View style={styles.sessionItem}>
                    <View style={styles.sessionIconCircle}>
                      <GearIcon size={16} color="#0284C7" />
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionTitle}>Exploración de disparadores emocionales</Text>
                      <Text style={styles.sessionSubtitle}>Semana pasada · 60 min · Plan activo</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Treatment Goals Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>OBJETIVOS TERAPÉUTICOS ACTIVOS</Text>
                <View style={styles.goalsCountBadge}>
                  <Text style={styles.goalsCountBadgeText}>
                    {student?.activeGoalsCount || 3} metas activas
                  </Text>
                </View>
              </View>

              <Text style={styles.goalsSub}>
                Enfoque clínico acordado con tu terapeuta para este ciclo de acompañamiento.
              </Text>

              {/* Goal 1 */}
              <View style={styles.goalRow}>
                <View style={styles.goalStatusIconActive}>
                  <CheckIcon size={13} color="#FFFFFF" />
                </View>
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>
                    Identificación de disparadores fisiológicos de tensión
                  </Text>
                  <Text style={styles.goalProgressText}>Progreso estimado: 80% · En curso</Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: '80%' }]} />
                  </View>
                </View>
              </View>

              {/* Goal 2 */}
              <View style={styles.goalRow}>
                <View style={styles.goalStatusIconCompleted}>
                  <CheckIcon size={13} color="#FFFFFF" />
                </View>
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>
                    Regulación autónoma mediante respiración guiada
                  </Text>
                  <Text style={styles.goalProgressText}>Progreso estimado: 100% · Meta afianzada</Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: '100%', backgroundColor: '#10B981' }]} />
                  </View>
                </View>
              </View>

              {/* Goal 3 */}
              <View style={styles.goalRow}>
                <View style={styles.goalStatusIconActive}>
                  <CheckIcon size={13} color="#FFFFFF" />
                </View>
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>
                    Higiene del sueño: mantener descanso ≥ 7 horas diarias
                  </Text>
                  <Text style={styles.goalProgressText}>Progreso estimado: 65% · En curso</Text>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: '65%' }]} />
                  </View>
                </View>
              </View>

              {/* Shared notes note */}
              <View style={styles.sharedNotesNote}>
                <Text style={styles.sharedNotesNoteText}>
                  ℹ️ Las reflexiones que decides compartir desde tu diario se abordan directamente en cada consulta clínica.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
  therapistLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  therapistLinkText: {
    fontSize: 13,
    color: '#0D9488',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.pill,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#334155',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  trendBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  chartCaption: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  histogramWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  correlationIntro: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  correlationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  correlationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  correlationTextWrap: {
    flex: 1,
  },
  correlationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  correlationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  insightBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  correlationBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  correlationTakeaway: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 6,
    backgroundColor: '#F0FDFA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sessionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  sessionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sessionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalsCountBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  goalsCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  goalsSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  goalStatusIconActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  goalStatusIconCompleted: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
  },
  goalProgressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 3,
  },
  sharedNotesNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.small,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sharedNotesNoteText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
  },
});
