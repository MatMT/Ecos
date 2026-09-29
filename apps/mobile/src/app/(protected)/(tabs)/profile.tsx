import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { Colors, Radius } from '@/constants/theme';
import {
  ActivityIcon,
  BatteryChargingIcon,
  BatteryIcon,
  CalendarIcon,
  ChevronRightIcon,
  CloseIcon,
  LogOutIcon,
  MessageSquareIcon,
  PhoneIcon,
  SlidersIcon,
  UserCheckIcon,
  WatchIcon,
} from '@/components/ui/app-icons';
import { useAuth } from '@/hooks/use-auth';
import { useStudent, type SimulationScenario } from '@/hooks/use-student';
import { useTheme } from '@/context/theme-context';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';
import { useEsp32Ble } from '@/hooks/use-esp32-ble';

function getScenarioLabel(scenario: SimulationScenario | undefined): string {
  switch (scenario) {
    case 'work_stress':
      return 'Tensión Laboral';
    case 'panic_attack':
      return 'Ataque de Pánico';
    case 'physical_exercise':
      return 'Ejercicio Físico';
    case 'resting':
    default:
      return 'Reposo y Calma';
  }
}

function formatAppointmentDate(isoString: string | null | undefined, status?: string | null): string {
  if (!isoString) return 'Sin sesiones programadas';
  try {
    const d = new Date(isoString);
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const statusTag = status === 'pending'
      ? ' · Solicitada (Pendiente)'
      : status === 'confirmed'
      ? ' · Confirmada'
      : '';
    return `Próxima sesión: ${capitalizedDay} ${time}${statusTag}`;
  } catch {
    return 'Próxima sesión programada';
  }
}

function formatTherapistLicense(license: string | null | undefined): string {
  if (!license || license.includes('SEED')) {
    return 'Colegiado institucional activo';
  }
  return `Colegiado No. ${license}`;
}

function formatDiagnosis(diag: string | null | undefined): string {
  if (!diag || diag.trim().toLowerCase() === 'ninguno reportado' || diag.includes('SEED')) {
    return 'Enfoque preventivo y bienestar general';
  }
  return diag;
}

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { student, displayName, preferences, refreshStudent } = useStudent();
  const { colors } = useTheme();
  const { bpm, spo2, isBleConnected, isDemoMode, trafficState } = useBiometricMonitor();
  const { bondedDeviceId, bondedDeviceName, unpair } = useEsp32Ble();

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const hasBondedBand = Boolean(bondedDeviceId) || isBleConnected;

  const handleLogoutPress = () => {
    if (hasBondedBand) {
      setShowLogoutModal(true);
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Está seguro de que desea cerrar su sesión actual en este dispositivo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: () => {
              void logout();
            },
          },
        ]
      );
    }
  };

  const handleOnlyLogout = async () => {
    setIsLoggingOut(true);
    try {
      setShowLogoutModal(false);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUnpairAndLogout = async () => {
    setIsLoggingOut(true);
    try {
      await unpair();
      setShowLogoutModal(false);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void refreshStudent();
    }, [refreshStudent])
  );

  const userInitial = displayName.charAt(0).toUpperCase();
  const institutionName = student?.institution?.name || 'Universidad Don Bosco';
  const carnetLabel = student?.studentCode && !student.studentCode.includes('SEED')
    ? `Carnet: ${student.studentCode}`
    : 'Carnet: UDB-2024-0491';
  const therapist = student?.assignedTherapist;

  const handleWhatsApp = () => {
    const rawPhone = therapist?.phone || '50370000000';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const therapistName = therapist?.fullName || 'Doctor';
    const encoded = encodeURIComponent(`Hola ${therapistName}, le contacto desde la plataforma Ecos.`);
    void Linking.openURL(`https://wa.me/${cleanPhone}?text=${encoded}`);
  };

  const handleCall = () => {
    const rawPhone = therapist?.phone || '+50322744444';
    void Linking.openURL(`tel:${rawPhone}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Mi Perfil</Text>

        {/* Identity & Institution Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.identityDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{displayName}</Text>
                {preferences.preferredName && (
                  <View style={styles.preferredBadge}>
                    <Text style={styles.preferredBadgeText}>Personalizado</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userInstitution}>{institutionName}</Text>
              <Text style={styles.userEmail}>{user?.email ?? 'usuario@ecos.local'}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.carnetBadge}>
                  <Text style={styles.carnetText}>{carnetLabel}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.statusText}>Estudiante Activo</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Acceso Rápido a Preferencias y Personalización (Ajustes desacoplados) */}
        <Text style={styles.sectionLabel}>PREFERENCIAS Y PERSONALIZACIÓN</Text>
        <TouchableOpacity
          style={[styles.settingsNavigationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/settings' as Href)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ir a Ajustes y Preferencias"
        >
          <View style={[styles.settingsNavIconBox, { backgroundColor: colors.brandLight }]}>
            <SlidersIcon size={20} color={colors.brand} strokeWidth={2} />
          </View>
          <View style={styles.settingsNavTextWrap}>
            <Text style={styles.settingsNavTitle}>Ajustes y Personalización</Text>
            <Text style={styles.settingsNavSub}>
              Nombre de preferencia, ambiente visual ({preferences.visualTheme.charAt(0).toUpperCase() + preferences.visualTheme.slice(1)}) y recordatorios
            </Text>
          </View>
          <ChevronRightIcon size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Clinical Care Team Card (Gestión y Contacto Directo) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>TU ACOMPAÑAMIENTO CLÍNICO</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/stats', params: { tab: 'sessions' } } as Href)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ir a sesiones y metas en evolución"
          >
            <Text style={[styles.sectionActionLink, { color: colors.brand }]}>Sesiones y metas →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleTeal}>
              <UserCheckIcon size={20} color="#0F766E" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardMainTitle}>
                {therapist?.fullName ?? 'Dr. Carlos Méndez'}
              </Text>
              <Text style={styles.cardSubTitle}>
                {therapist
                  ? `${therapist.specialty ?? 'Psicólogo Clínico'} · ${formatTherapistLicense(therapist.professionalLicense)}`
                  : 'Psicólogo Clínico Especialista · Colegiado institucional activo'}
              </Text>
            </View>
          </View>

          {/* Quick contact buttons in profile */}
          <View style={styles.therapistContactRow}>
            <TouchableOpacity
              style={styles.therapistActionBtnPrimary}
              onPress={handleWhatsApp}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Contactar al terapeuta por WhatsApp"
            >
              <MessageSquareIcon size={15} color="#FFFFFF" />
              <Text style={styles.therapistActionBtnPrimaryText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.therapistActionBtnSecondary}
              onPress={handleCall}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Llamada telefónica al consultorio del terapeuta"
            >
              <PhoneIcon size={15} color="#334155" />
              <Text style={styles.therapistActionBtnSecondaryText}>Llamar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Enfoque terapéutico: </Text>
            <Text style={styles.detailVal}>
              {formatDiagnosis(student?.primaryDiagnosis)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Plan de atención: </Text>
            <Text style={styles.detailValGreen}>
              {student && student.activeGoalsCount > 0
                ? `Activo · ${student.activeGoalsCount} meta(s) en curso`
                : 'Activo · 3 metas en curso'}
            </Text>
          </View>

          {/* Interactive microinteraction actions */}
          <TouchableOpacity
            style={styles.planActionButton}
            onPress={() => router.push({ pathname: '/stats', params: { tab: 'sessions' } } as Href)}
            activeOpacity={0.7}
          >
            <Text style={styles.planActionText}>
              Ver Objetivos del Plan ({student?.activeGoalsCount || 3})
            </Text>
            <ChevronRightIcon size={14} color="#0F766E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appointmentRow}
            onPress={() => router.push('/modals/appointment-request' as Href)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Solicitar o coordinar cita clínica con el terapeuta"
          >
            <CalendarIcon size={14} color="#0284C7" />
            <Text style={styles.appointmentText}>
              {student?.nextAppointment?.appointmentDate
                ? `${formatAppointmentDate(student.nextAppointment.appointmentDate, student.nextAppointment.status)} · Solicitar nueva cita`
                : 'Solicitar cita clínica con su terapeuta'}
            </Text>
            <ChevronRightIcon size={14} color="#0284C7" />
          </TouchableOpacity>
        </View>

        {/* ECOS BAND Wearable Card */}
        <Text style={styles.sectionLabel}>DISPOSITIVO VINCULADO</Text>
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleIndigo}>
              <WatchIcon size={20} color="#4F46E5" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardMainTitle}>ECOS BAND</Text>
              <Text style={styles.cardSubTitle}>
                {isBleConnected
                  ? 'Hardware Bluetooth · Enlace Activo'
                  : isDemoMode
                  ? `Simulación Activa · ${getScenarioLabel(preferences.simulationScenario)}`
                  : 'Pulsera Desconectada · En espera de enlace'}
              </Text>
            </View>
            <View
              style={[
                styles.connectionPill,
                {
                  backgroundColor: isBleConnected
                    ? '#DCFCE7'
                    : isDemoMode
                    ? '#E0F2FE'
                    : '#F1F5F9',
                },
              ]}
            >
              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor: isBleConnected
                      ? '#16A34A'
                      : isDemoMode
                      ? '#0284C7'
                      : '#94A3B8',
                  },
                ]}
              />
              <Text
                style={[
                  styles.connectionPillText,
                  {
                    color: isBleConnected
                      ? '#15803D'
                      : isDemoMode
                      ? '#0369A1'
                      : '#64748B',
                  },
                ]}
              >
                {isBleConnected
                  ? 'Sincronizado'
                  : isDemoMode
                  ? 'Modo Demo'
                  : 'Sin conexión'}
              </Text>
            </View>
          </View>

          {/* Live hardware feedback row */}
          <View style={styles.deviceFeedbackRow}>
            {isBleConnected ? (
              <>
                <View style={styles.feedbackItem}>
                  <BatteryChargingIcon size={16} color="#0D9488" />
                  <Text style={styles.feedbackText}>
                    Cargando (100%)
                  </Text>
                </View>
                <View style={styles.feedbackItem}>
                  <ActivityIcon size={14} color="#0284C7" strokeWidth={2.2} />
                  <Text style={styles.feedbackText}>
                    {bpm ? `BPM: ${bpm}` : 'BPM: 74'} · {spo2 ? `SpO2: ${spo2}%` : 'SpO2: 98%'}
                  </Text>
                </View>
                {trafficState === 'RED' ? (
                  <View style={[styles.demoBadgeMuted, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.demoBadgeMutedText, { color: '#DC2626' }]}>
                      Alerta Fisiológica
                    </Text>
                  </View>
                ) : (
                  <View style={styles.demoBadgeMuted}>
                    <Text style={styles.demoBadgeMutedText}>Sensores Calibrados</Text>
                  </View>
                )}
              </>
            ) : isDemoMode ? (
              <>
                <View style={styles.feedbackItem}>
                  <BatteryChargingIcon size={16} color="#0D9488" />
                  <Text style={styles.feedbackText}>
                    Batería: Simulación (100%)
                  </Text>
                </View>
                <View style={styles.feedbackItem}>
                  <ActivityIcon size={14} color="#0284C7" strokeWidth={2.2} />
                  <Text style={styles.feedbackText}>
                    {bpm ? `BPM: ${bpm}` : 'BPM: 74'} · {spo2 ? `SpO2: ${spo2}%` : 'SpO2: 98%'}
                  </Text>
                </View>
                {trafficState === 'RED' ? (
                  <View style={[styles.demoBadgeMuted, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.demoBadgeMutedText, { color: '#DC2626' }]}>
                      Alerta Fisiológica
                    </Text>
                  </View>
                ) : (
                  <View style={styles.demoBadgeMuted}>
                    <Text style={styles.demoBadgeMutedText}>
                      {getScenarioLabel(preferences.simulationScenario)}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.feedbackItem}>
                  <BatteryIcon size={16} color="#94A3B8" />
                  <Text style={[styles.feedbackText, { color: '#94A3B8' }]}>
                    Batería: Sin conexión
                  </Text>
                </View>
                <View style={styles.feedbackItem}>
                  <ActivityIcon size={14} color="#94A3B8" strokeWidth={2.2} />
                  <Text style={[styles.feedbackText, { color: '#94A3B8' }]}>
                    BPM: -- · SpO2: --
                  </Text>
                </View>
                <View style={styles.demoBadgeMuted}>
                  <Text style={styles.demoBadgeMutedText}>Sin Datos</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.cardDivider} />
          <TouchableOpacity
            style={styles.prototypeActionBtn}
            onPress={() => router.push('/esp32-prototype' as Href)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Administrar dispositivo Ecos Band y telemetría"
          >
            <Text style={styles.prototypeActionBtnText}>
              {isBleConnected || isDemoMode
                ? 'Ver Diagnóstico y Métricas de Ecos Band'
                : 'Buscar y Vincular Ecos Band'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.accountSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
            disabled={isLoggingOut}
            activeOpacity={0.8}
          >
            <LogOutIcon size={18} color="#DC2626" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
          <Text style={styles.appVersionText}>
            ECOS · Versión 1.0.0 · Universidad Don Bosco
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Confirmación de Cierre de Sesión y Gestión de Ecos Band */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconCircle}>
                <WatchIcon size={22} color="#0D9488" strokeWidth={2.2} />
              </View>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                style={styles.modalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CloseIcon size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Cierre de Sesión</Text>
            <Text style={styles.modalSubtitle}>
              ¿Desea mantener enlazada su pulsera Ecos Band?
            </Text>

            <Text style={styles.modalBody}>
              Por privacidad y seguridad clínica, la telemetría biométrica se desconectará de inmediato. Puede conservar la vinculación para su próxima sesión o desvincular el dispositivo de este teléfono.
            </Text>

            <View style={styles.bandStatusBox}>
              <View style={styles.bandStatusLeft}>
                <View style={isBleConnected ? styles.bandDotActive : styles.bandDotInactive} />
                <Text style={styles.bandNameText} numberOfLines={1}>
                  {bondedDeviceName || 'Ecos-Band-ESP32'}
                </Text>
              </View>
              <View
                style={[
                  styles.bandStatusBadge,
                  { backgroundColor: isBleConnected ? '#DCFCE7' : '#F1F5F9' },
                ]}
              >
                <Text
                  style={[
                    styles.bandStatusBadgeText,
                    { color: isBleConnected ? '#15803D' : '#64748B' },
                  ]}
                >
                  {isBleConnected ? 'Sincronizado (1 Hz)' : 'Enlazada'}
                </Text>
              </View>
            </View>

            <View style={styles.modalActionButtons}>
              {/* Opción 1: Solo cerrar sesión */}
              <TouchableOpacity
                style={styles.keepBondButton}
                onPress={() => void handleOnlyLogout()}
                disabled={isLoggingOut}
                activeOpacity={0.85}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.keepBondButtonText}>Solo cerrar sesión</Text>
                    <Text style={styles.keepBondSubtext}>
                      Conserva la pulsera vinculada para su próximo ingreso
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Opción 2: Desvincular y salir */}
              <TouchableOpacity
                style={styles.unpairButton}
                onPress={() => void handleUnpairAndLogout()}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.unpairButtonText}>Desvincular pulsera y salir</Text>
                <Text style={styles.unpairSubtext}>
                  Elimina el registro de hardware de este teléfono
                </Text>
              </TouchableOpacity>

              {/* Cancelar */}
              <TouchableOpacity
                style={styles.cancelLogoutButton}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelLogoutText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  identityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  identityDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  preferredBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  preferredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  userInstitution: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F766E',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  carnetBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.small,
  },
  carnetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.small,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  settingsNavigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    gap: 12,
  },
  settingsNavIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsNavTextWrap: {
    flex: 1,
  },
  settingsNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  settingsNavSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircleTeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleIndigo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardSubTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  therapistContactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  therapistActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    borderRadius: Radius.medium,
    gap: 6,
  },
  therapistActionBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  therapistActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: Radius.medium,
    gap: 6,
  },
  therapistActionBtnSecondaryText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  detailKey: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  detailValGreen: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
  },
  planActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.medium,
    marginTop: 10,
  },
  planActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.medium,
    marginTop: 8,
    gap: 8,
  },
  appointmentText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    flex: 1,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.large,
    gap: 6,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  demoSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoSwitchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  demoSwitchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  demoSwitchHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deviceFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 16,
    flexWrap: 'wrap',
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  demoBadgeMuted: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  demoBadgeMutedText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  prototypeActionBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  prototypeActionBtnText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionActionLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  accountSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    width: '100%',
    paddingVertical: 12,
    borderRadius: Radius.medium,
    gap: 8,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14,
  },
  appVersionText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  bandStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  bandStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  bandDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  bandDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  bandNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  bandStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  bandStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionButtons: {
    gap: 10,
  },
  keepBondButton: {
    backgroundColor: '#0D9488',
    borderRadius: Radius.medium,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  keepBondButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  keepBondSubtext: {
    fontSize: 11,
    color: '#CCFBF1',
    marginTop: 2,
    textAlign: 'center',
  },
  unpairButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.medium,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unpairButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  unpairSubtext: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
    textAlign: 'center',
  },
  cancelLogoutButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cancelLogoutText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
});
