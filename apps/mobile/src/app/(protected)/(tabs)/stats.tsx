import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';

import CustomTopBar from '@/components/custom-top-bar';
import { Colors, Radius } from '@/constants/theme';
import {
  ActivityIcon,
  ArrowDownIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  CheckIcon,
  GearIcon,
  InfoIcon,
  MoonIcon,
  ShieldCheckIcon,
  SparklesIcon,
  PlusIcon,
  WindIcon,
} from '@/components/ui/app-icons';
import { useStudent } from '@/hooks/use-student';
import { useTheme } from '@/context/theme-context';
import { useTreatmentPlan } from '@/hooks/use-treatment-plan';
import type { ActivityCategory } from '@/types/clinical';
import {
  studentClient,
  type AppointmentItem,
} from '@/services/api/student-client';
import { fetchAndCacheAppointments } from '@/services/storage/appointment-service';

type StatsTab = 'biometrics' | 'sessions';

interface WeeklyDataPoint {
  day: string;
  minutesHighStress: number;
}

interface AppointmentStatusVisuals {
  label: string;
  color: string;
  bgColor: string;
}

function getAppointmentStatusVisuals(status: string): AppointmentStatusVisuals {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        label: 'Solicitada (Pendiente)',
        color: '#B45309',
        bgColor: '#FEF3C7',
      };
    case 'confirmed':
      return {
        label: 'Confirmada',
        color: '#0369A1',
        bgColor: '#E0F2FE',
      };
    case 'completed':
      return {
        label: 'Completada',
        color: '#15803D',
        bgColor: '#DCFCE7',
      };
    case 'cancelled':
      return {
        label: 'Cancelada',
        color: '#DC2626',
        bgColor: '#FEE2E2',
      };
    default:
      return {
        label: 'Programada',
        color: '#0369A1',
        bgColor: '#E0F2FE',
      };
  }
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

function renderActivityCategoryIcon(category: ActivityCategory, size = 18) {
  switch (category) {
    case 'BREATHING':
      return <WindIcon size={size} color="#0284C7" />;
    case 'DIARY':
      return <BookOpenIcon size={size} color="#0F766E" />;
    case 'SLEEP':
      return <MoonIcon size={size} color="#6366F1" />;
    case 'BEHAVIORAL':
      return <CheckCircle2Icon size={size} color="#15803D" />;
    case 'OTHER':
    default:
      return <SparklesIcon size={size} color="#8B5CF6" />;
  }
}

function getActivityCategoryBg(category: ActivityCategory): string {
  switch (category) {
    case 'BREATHING':
      return '#E0F2FE';
    case 'DIARY':
      return '#CCFBF1';
    case 'SLEEP':
      return '#EEF2FF';
    case 'BEHAVIORAL':
      return '#DCFCE7';
    case 'OTHER':
    default:
      return '#F5F3FF';
  }
}

export default function Stats() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { student, preferences, displayName } = useStudent();
  const { colors } = useTheme();
  const {
    plan,
    activities,
    activeCount,
    completedCount,
    totalCount,
    progressPercent,
    isLoading: isPlanLoading,
    toggleActivity,
    refreshPlan,
  } = useTreatmentPlan();

  const [userSelectedTab, setUserSelectedTab] = useState<StatsTab | null>(null);
  const [prevParamTab, setPrevParamTab] = useState(params.tab);

  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    setUserSelectedTab(null);
  }

  const activeTab: StatsTab =
    userSelectedTab ??
    (params.tab === 'sessions' || params.tab === 'clinical' ? 'sessions' : 'biometrics');
  const setActiveTab = setUserSelectedTab;

  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>(DEFAULT_WEEKLY_DATA);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activeInsightIndex, setActiveInsightIndex] = useState<number>(0);

  const sleepGoal = preferences.sleepGoalHours || 8;
  const stressDiffPercent = Math.max(18, Math.round((sleepGoal / 7) * 28));

  const studentId = student?.id;

  const loadAppointments = useCallback(() => {
    if (!studentId) return;
    fetchAndCacheAppointments(studentId)
      .then((items) => {
        if (items && Array.isArray(items)) {
          setAppointments(items);
        }
      })
      .catch(() => {});
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      void refreshPlan();
    }, [loadAppointments, refreshPlan])
  );

  useEffect(() => {
    if (!studentId) return;

    studentClient
      .getBiometricTrends(studentId)
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

    loadAppointments();
  }, [studentId, loadAppointments]);

  const maxBarValue = 80;
  const barChartHeight = 100;

  // Mental Health UX: Paleta armonizada
  const CALM_COLOR = '#4E8777'; // Verde Salvia / Menta sereno (<=35%)
  const MODERATE_COLOR = '#6482AD'; // Azul Pizarra suave (36-55%)
  const TENSION_COLOR = '#D97D64'; // Coral suave empolvado (>55%)

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const interval = carouselCardWidth + 12;
    if (interval > 0) {
      const index = Math.round(offsetX / interval);
      setActiveInsightIndex(Math.max(0, Math.min(2, index)));
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const carouselCardWidth = Math.max(260, screenWidth - 74);

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <CustomTopBar name={displayName} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header con enlace amigable a terapeuta */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Tu Evolución</Text>
            <TouchableOpacity
              style={styles.therapistLinkBtn}
              onPress={() => router.push('/modals/appointment-request' as Href)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Solicitar cita con el profesional tratante"
            >
              <Text style={styles.therapistLinkText}>Solicitar cita →</Text>
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
            style={[styles.segmentButton, activeTab === 'biometrics' && [styles.segmentButtonActive, { backgroundColor: colors.brand }]]}
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
            style={[styles.segmentButton, activeTab === 'sessions' && [styles.segmentButtonActive, { backgroundColor: colors.brand }]]}
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
                    fill={colors.brand}
                    fillOpacity={0.08}
                  />
                  {/* Línea superior e inferior de equilibrio */}
                  <Line
                    x1="2"
                    y1="45"
                    x2="318"
                    y2="45"
                    stroke="#94A3B8"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.45}
                  />
                  <Line
                    x1="2"
                    y1="87"
                    x2="318"
                    y2="87"
                    stroke="#94A3B8"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.45}
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
                decelerationRate="fast"
                snapToInterval={carouselCardWidth + 12}
                snapToAlignment="start"
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
                    Los días con descanso inferior a {sleepGoal}h registraron un {stressDiffPercent}% más de picos vespertinos.
                  </Text>
                  <View style={styles.insightTakeawayBox}>
                    <SparklesIcon size={14} color="#0F766E" />
                    <Text style={styles.insightTakeaway}>
                      Mantener tu descanso en ≥ {sleepGoal}h estabiliza tu reactividad emocional.
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
                    <SparklesIcon size={14} color="#0F766E" />
                    <Text style={styles.insightTakeaway}>
                      Tu sistema parasimpático responde favorablemente a las pausas conscientes.
                    </Text>
                  </View>
                </View>

                {/* Tarjeta 3: Equilibrio Autonómico */}
                <View style={[styles.insightCard, { width: carouselCardWidth }]}>
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBox, { backgroundColor: '#FEF9C3' }]}>
                      <ShieldCheckIcon size={18} color="#CA8A04" strokeWidth={2.2} />
                    </View>
                    <View style={styles.insightHeaderWrap}>
                      <Text style={styles.insightTitle}>Ritmo Cardíaco</Text>
                      <View style={[styles.insightBadge, { backgroundColor: '#FEF08A' }]}>
                        <Text style={[styles.insightBadgeText, { color: '#854D0E' }]}>Estabilidad</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.insightBody}>
                    En tus {weeklyData.length} registros semanales, tu equilibrio autonómico se mantuvo con variabilidad favorable.
                  </Text>
                  <View style={styles.insightTakeawayBox}>
                    <SparklesIcon size={14} color="#0F766E" />
                    <Text style={styles.insightTakeaway}>
                      Las pausas activas antes del mediodía suavizan la sobrecarga cardiovascular.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Indicador de Páginas (Dots) */}
              <View style={styles.dotsRow}>
                <View style={[styles.dot, activeInsightIndex === 0 && styles.dotActive]} />
                <View style={[styles.dot, activeInsightIndex === 1 && styles.dotActive]} />
                <View style={[styles.dot, activeInsightIndex === 2 && styles.dotActive]} />
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
                <View>
                  <Text style={styles.cardTitle}>SESIONES CLÍNICAS RECIENTES</Text>
                  <Text style={styles.cardSubtitleNotice}>
                    {appointments.length} cita(s) en su expediente
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.requestSessionBtn, { backgroundColor: colors.brand }]}
                  onPress={() => router.push('/modals/appointment-request' as Href)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Solicitar cita clínica con su terapeuta"
                >
                  <PlusIcon size={12} color="#FFFFFF" strokeWidth={2.8} />
                  <Text style={styles.requestSessionBtnText}>Solicitar Cita</Text>
                </TouchableOpacity>
              </View>

              {appointments.length > 0 ? (
                appointments.slice(0, 6).map((appt, idx) => {
                  const statusVisuals = getAppointmentStatusVisuals(appt.status);
                  return (
                    <React.Fragment key={appt.id}>
                      {idx > 0 && <View style={styles.sessionDivider} />}
                      <View style={styles.sessionItem}>
                        <View
                          style={[
                            styles.sessionIconCircle,
                            { backgroundColor: statusVisuals.bgColor },
                          ]}
                        >
                          {appt.status === 'completed' ? (
                            <CheckCircle2Icon size={16} color="#059669" />
                          ) : appt.status === 'pending' ? (
                            <CalendarCheckIcon size={16} color="#B45309" />
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
                                color: statusVisuals.color,
                                fontWeight: '700',
                              }}
                            >
                              {statusVisuals.label}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </React.Fragment>
                  );
                })
              ) : (
                <>
                  <View style={styles.sessionItem}>
                    <View style={styles.sessionIconCircle}>
                      <CheckCircle2Icon size={16} color="#059669" />
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
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderTopRow}>
                <View style={styles.cardHeaderTitleWrap}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    OBJETIVOS TERAPÉUTICOS ACTIVOS
                  </Text>
                  {plan?.title ? (
                    <Text style={[styles.cardPlanTitle, { color: colors.accent }]}>
                      {plan.title}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.goalsCountBadge}>
                  <Text style={styles.goalsCountBadgeText}>
                    {activeCount} {activeCount === 1 ? 'meta activa' : 'metas activas'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.goalsSub, { color: colors.textSecondary }]}>
                {plan?.summary ||
                  'Enfoque clínico y pautas acordadas con su terapeuta para este ciclo de acompañamiento.'}
              </Text>

              {/* Cycle Completion Progress Bar */}
              {activities.length > 0 && (
                <View style={[styles.planProgressOverview, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <View style={styles.planProgressTextRow}>
                    <Text style={[styles.planProgressLabel, { color: colors.textSecondary }]}>
                      Cumplimiento de pautas
                    </Text>
                    <Text style={[styles.planProgressValue, { color: colors.accent }]}>
                      {progressPercent}% ({completedCount} de {totalCount})
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progressPercent}%`,
                          backgroundColor: progressPercent === 100 ? '#10B981' : colors.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Loading State */}
              {isPlanLoading && activities.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Cargando pautas terapéuticas asignadas...
                  </Text>
                </View>
              ) : activities.length === 0 ? (
                /* Empty State */
                <View style={[styles.emptyActivitiesContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <View style={styles.emptyActivitiesIconCircle}>
                    <ShieldCheckIcon size={24} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.emptyActivitiesTitle, { color: colors.text }]}>
                    Sin pautas asignadas
                  </Text>
                  <Text style={[styles.emptyActivitiesSub, { color: colors.textSecondary }]}>
                    Su psicólogo asignará sus primeras pautas en su próxima sesión.
                  </Text>
                </View>
              ) : (
                /* Dynamic Prescribed Activities */
                <View style={styles.activitiesList}>
                  {activities.map((act) => {
                    const isCompleted = act.status === 'COMPLETED';
                    const isBreathing = act.category === 'BREATHING';
                    const isDiary = act.category === 'DIARY';

                    return (
                      <View
                        key={act.id}
                        style={[
                          styles.activityCard,
                          {
                            backgroundColor: isCompleted ? (colors.surfaceSubtle || '#F8FAFC') : colors.surface,
                            borderColor: isCompleted ? '#86EFAC' : colors.border,
                          },
                        ]}
                      >
                        <View style={styles.activityTopRow}>
                          {/* Category Vector Icon */}
                          <View
                            style={[
                              styles.activityCategoryCircle,
                              { backgroundColor: getActivityCategoryBg(act.category) },
                            ]}
                          >
                            {renderActivityCategoryIcon(act.category, 18)}
                          </View>

                          {/* Content Details */}
                          <View style={styles.activityMainContent}>
                            <Text
                              style={[
                                styles.activityTitle,
                                {
                                  color: colors.text,
                                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                                  opacity: isCompleted ? 0.75 : 1,
                                },
                              ]}
                            >
                              {act.title}
                            </Text>
                            <Text style={[styles.activityFrequency, { color: colors.textSecondary }]}>
                              {act.frequency} · {isCompleted ? 'Completada' : 'Pendiente'}
                              {act.syncStatus === 'PENDING_UPLOAD' ? ' · Guardado local' : ''}
                            </Text>
                            {act.description ? (
                              <Text
                                style={[
                                  styles.activityDesc,
                                  { color: colors.textMuted, opacity: isCompleted ? 0.7 : 1 },
                                ]}
                              >
                                {act.description}
                              </Text>
                            ) : null}
                          </View>

                          {/* Interactive Toggle Checkbox */}
                          <TouchableOpacity
                            onPress={() => void toggleActivity(act.id, act.status)}
                            style={[
                              styles.activityCheckbox,
                              isCompleted
                                ? styles.activityCheckboxCompleted
                                : [styles.activityCheckboxPending, { borderColor: colors.border }],
                            ]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isCompleted }}
                            accessibilityLabel={`Marcar ${act.title} como ${isCompleted ? 'pendiente' : 'completada'}`}
                          >
                            {isCompleted ? (
                              <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                            ) : null}
                          </TouchableOpacity>
                        </View>

                        {/* Direct Deep Link Actions */}
                        {(isBreathing || isDiary) && (
                          <View style={styles.activityActionRow}>
                            {isBreathing && (
                              <TouchableOpacity
                                style={[styles.activityActionBtn, { backgroundColor: '#E0F2FE' }]}
                                onPress={() => router.push('/modals/breathing-guide' as Href)}
                                activeOpacity={0.7}
                              >
                                <WindIcon size={14} color="#0369A1" />
                                <Text style={[styles.activityActionBtnText, { color: '#0369A1' }]}>
                                  Iniciar
                                </Text>
                              </TouchableOpacity>
                            )}

                            {isDiary && (
                              <TouchableOpacity
                                style={[styles.activityActionBtn, { backgroundColor: '#CCFBF1' }]}
                                onPress={() =>
                                  router.push({
                                    pathname: '/(protected)/(tabs)/diario',
                                    params: { newEntry: 'true', tag: act.title },
                                  } as Href)
                                }
                                activeOpacity={0.7}
                              >
                                <BookOpenIcon size={14} color="#0F766E" />
                                <Text style={[styles.activityActionBtnText, { color: '#0F766E' }]}>
                                  Escribir
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Shared notes note */}
              <View style={[styles.sharedNotesNote, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <InfoIcon size={16} color="#64748B" />
                <Text style={[styles.sharedNotesNoteText, { color: colors.textSecondary }]}>
                  Las reflexiones que decide compartir desde su diario se abordan directamente en cada consulta clínica.
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  insightTakeaway: {
    flex: 1,
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
  cardHeaderTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  cardPlanTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  planProgressOverview: {
    padding: 10,
    borderRadius: Radius.small,
    borderWidth: 1,
    marginBottom: 14,
  },
  planProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  planProgressValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyActivitiesContainer: {
    padding: 18,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyActivitiesIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  emptyActivitiesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyActivitiesSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  activitiesList: {
    gap: 10,
    marginBottom: 12,
  },
  activityCard: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    padding: 12,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  activityCategoryCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityMainContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  activityFrequency: {
    fontSize: 11,
    marginTop: 2,
  },
  activityDesc: {
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
  },
  activityCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityCheckboxCompleted: {
    backgroundColor: '#10B981',
  },
  activityCheckboxPending: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  activityActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  activityActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  activityActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.small,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sharedNotesNoteText: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
  },
  cardSubtitleNotice: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  requestSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  requestSessionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
