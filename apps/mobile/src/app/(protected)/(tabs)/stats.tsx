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
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';

import CustomTopBar from '@/components/custom-top-bar';
import { Colors, Radius } from '@/constants/theme';
import {
  ActivityIcon,
  ArrowDownIcon,
  CalendarCheckIcon,
  CheckIcon,
  GearIcon,
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
  const [activeInsightIndex, setActiveInsightIndex] = useState<number>(0);

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
  const barChartHeight = 100;

  // Mental Health UX: Paleta suave y calmante
  const CALM_COLOR = '#86A789'; // Verde Salvia
  const MODERATE_COLOR = '#DFB15B'; // Ámbar Arena Suave
  const TENSION_COLOR = '#E07A5F'; // Coral Suave

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const width = e.nativeEvent.layoutMeasurement.width;
    if (width > 0) {
      const index = Math.round(offsetX / width);
      setActiveInsightIndex(index);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const carouselCardWidth = Math.max(280, screenWidth - 76);

  return (
    <View style={styles.mainContainer}>
      <CustomTopBar name={displayName} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header con enlace amigable a terapeuta */}
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
              ? 'Descubre cómo tus hábitos y tus horas de sueño influyen en tu tranquilidad diaria.'
              : 'Historial de sesiones clínicas, acuerdos terapéuticos y metas acordadas con tu equipo.'}
          </Text>
        </View>

        {/* Selector Segmentado con iconos vectoriales limpios */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'biometrics' && styles.segmentButtonActive]}
            onPress={() => setActiveTab('biometrics')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'biometrics' }}
          >
            <ActivityIcon
              size={15}
              color={activeTab === 'biometrics' ? '#FFFFFF' : '#64748B'}
              strokeWidth={2.2}
            />
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
            <CalendarCheckIcon
              size={15}
              color={activeTab === 'sessions' ? '#FFFFFF' : '#64748B'}
              strokeWidth={2}
            />
            <Text style={[styles.segmentButtonText, activeTab === 'sessions' && styles.segmentButtonTextActive]}>
              Sesiones y Metas
            </Text>
          </TouchableOpacity>
        </View>

        {/* VISTA 1: BIOMETRÍA Y HÁBITOS */}
        {activeTab === 'biometrics' && (
          <>
            {/* Weekly Stress Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderStack}>
                <View style={styles.cardHeaderTopRow}>
                  <Text style={styles.cardTitle}>FRECUENCIA SEMANAL DE ESTRÉS</Text>
                  <View style={styles.trendBadge}>
                    <ArrowDownIcon size={12} color="#15803D" />
                    <Text style={styles.trendText}>Tendencia Favorable</Text>
                  </View>
                </View>
                <Text style={styles.chartCaption}>
                  Nivel promedio de tensión diaria con franja de equilibrio adaptativo
                </Text>
              </View>

              <View style={styles.histogramWrapper}>
                <Svg height="140" width="100%" viewBox="0 0 320 140">
                  {/* Zona de equilibrio translúcida sin texto invasivo */}
                  <Rect
                    x="2"
                    y="45"
                    width="316"
                    height="42"
                    rx={6}
                    fill={CALM_COLOR}
                    fillOpacity={0.09}
                  />
                  {/* Línea superior e inferior de equilibrio */}
                  <Line
                    x1="2"
                    y1="45"
                    x2="318"
                    y2="45"
                    stroke={CALM_COLOR}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                  <Line
                    x1="2"
                    y1="87"
                    x2="318"
                    y2="87"
                    stroke={CALM_COLOR}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />

                  {weeklyData.map((item, index) => {
                    const barWidth = 24;
                    const spacing = (320 - barWidth * 7) / 8;
                    const x = spacing + index * (barWidth + spacing);
                    const height = Math.min(
                      barChartHeight,
                      (item.minutesHighStress / maxBarValue) * barChartHeight,
                    );
                    const y = 112 - height;

                    // Tonos orgánicos y no punitivos
                    const barColor =
                      item.minutesHighStress <= 35
                        ? CALM_COLOR // Verde salvia
                        : item.minutesHighStress <= 55
                        ? MODERATE_COLOR // Ámbar suave
                        : TENSION_COLOR; // Coral suave

                    return (
                      <React.Fragment key={item.day + index}>
                        <Rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx={12}
                          fill={barColor}
                        />
                        <SvgText
                          x={x + barWidth / 2}
                          y="130"
                          fill="#64748B"
                          fontSize="11"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {item.day}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </Svg>

                {/* Leyenda limpia incluyendo muestra de rango óptimo */}
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: CALM_COLOR }]} />
                    <Text style={styles.legendText}>Calma</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: MODERATE_COLOR }]} />
                    <Text style={styles.legendText}>Moderado</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: TENSION_COLOR }]} />
                    <Text style={styles.legendText}>Tensión</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.legendOptimalDash} />
                    <Text style={styles.legendText}>Rango óptimo</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Carrusel Swipeable de Patrones y Correlaciones */}
            <View style={styles.card}>
              <View style={styles.carouselHeaderRow}>
                <Text style={styles.sectionHeader}>LO QUE TU CUERPO NOS CUENTA</Text>
                <Text style={styles.correlationIntro}>
                  Conexiones observadas entre tu descanso y tu nivel de calma.
                </Text>
              </View>

              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleCarouselScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.carouselScrollContent}
              >
                {/* Tarjeta 1: Sueño y Tensión */}
                <View style={[styles.insightCard, { width: carouselCardWidth }]}>
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBox, { backgroundColor: '#F0FDF4' }]}>
                      <MoonIcon size={18} color="#0D9488" />
                    </View>
                    <View style={styles.insightHeaderWrap}>
                      <Text style={styles.insightTitle}>Sueño y Tensión</Text>
                      <View style={styles.insightBadge}>
                        <Text style={styles.insightBadgeText}>Impacto directo</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.insightBody}>
                    Los días con descanso menor a 7h registraron un 32% más de picos vespertinos.
                  </Text>
                  <View style={styles.insightTakeawayBox}>
                    <Text style={styles.insightTakeaway}>
                      💡 Mantener tu descanso en ≥ 7h estabiliza tu reactividad emocional.
                    </Text>
                  </View>
                </View>

                {/* Tarjeta 2: Efecto Biofeedback */}
                <View style={[styles.insightCard, { width: carouselCardWidth }]}>
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBox, { backgroundColor: '#F0F9FF' }]}>
                      <ActivityIcon size={18} color="#0284C7" strokeWidth={2.2} />
                    </View>
                    <View style={styles.insightHeaderWrap}>
                      <Text style={styles.insightTitle}>Efecto Biofeedback</Text>
                      <View style={[styles.insightBadge, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.insightBadgeText, { color: '#0369A1' }]}>Recuperación</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.insightBody}>
                    Tu respiración consciente redujo tu pulso basal en 4 lpm de promedio.
                  </Text>
                  <View style={styles.insightTakeawayBox}>
                    <Text style={styles.insightTakeaway}>
                      💡 Tu sistema parasimpático responde favorablemente a las pausas conscientes.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Indicador de Páginas (Dots) */}
              <View style={styles.dotsRow}>
                <View style={[styles.dot, activeInsightIndex === 0 && styles.dotActive]} />
                <View style={[styles.dot, activeInsightIndex === 1 && styles.dotActive]} />
              </View>
            </View>
          </>
        )}

        {/* VISTA 2: SESIONES Y METAS */}
        {activeTab === 'sessions' && (
          <>
            {/* Recent Sessions */}
            <View style={styles.card}>
              <View style={styles.cardHeaderTopRow}>
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
              <View style={styles.cardHeaderTopRow}>
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
                  <CheckIcon size={13} color="#FFFFFF" strokeWidth={3} />
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
                  <CheckIcon size={13} color="#FFFFFF" strokeWidth={3} />
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
                  <CheckIcon size={13} color="#FFFFFF" strokeWidth={3} />
                </View>
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>
                    Higiene del sueño: mantener descanso regular
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
    borderRadius: Radius.large,
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
  cardHeaderStack: {
    marginBottom: 10,
  },
  cardHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
    lineHeight: 16,
  },
  histogramWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendOptimalDash: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#86A789',
    opacity: 0.7,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  carouselHeaderRow: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  correlationIntro: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  carouselScrollContent: {
    paddingVertical: 6,
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  insightIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightHeaderWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 14,
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
  insightBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  insightTakeawayBox: {
    backgroundColor: '#F0FDFA',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  insightTakeaway: {
    fontSize: 11.5,
    color: '#0F766E',
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#0D9488',
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
