import React, { useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Radius } from '@/constants/theme';
import {
  BatteryIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  LockIcon,
  LogOutIcon,
  MessageSquareIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  WatchIcon,
} from '@/components/ui/app-icons';
import { useAuth } from '@/hooks/use-auth';
import { useStudent, type CheckInFrequency, type VisualTheme } from '@/hooks/use-student';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';

function formatAppointmentDate(isoString: string | null | undefined): string {
  if (!isoString) return 'Sin sesiones programadas';
  try {
    const d = new Date(isoString);
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return `Próxima sesión: ${capitalizedDay} ${time}`;
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
  const { student, displayName, preferences, updatePreferences } = useStudent();
  const { isBleConnected } = useBiometricMonitor();

  const [isNameModalVisible, setIsNameModalVisible] = useState<boolean>(false);
  const [tempPreferredName, setTempPreferredName] = useState<string>(preferences.preferredName || '');

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

  const handleSavePreferredName = async () => {
    await updatePreferences({ preferredName: tempPreferredName.trim() || undefined });
    setIsNameModalVisible(false);
  };

  const handleSelectTheme = async (theme: VisualTheme) => {
    await updatePreferences({ visualTheme: theme });
  };

  const handleSelectFrequency = async (freq: CheckInFrequency) => {
    await updatePreferences({ checkInFrequency: freq });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Mi Perfil</Text>

        {/* Identity & Institution Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
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

        {/* Preferencias y Personalización (Empoderamiento y Agencia del Usuario) */}
        <Text style={styles.sectionLabel}>PREFERENCIAS Y PERSONALIZACIÓN</Text>
        <View style={styles.infoCard}>
          {/* Nombre de Preferencia */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextCol}>
              <Text style={styles.preferenceTitle}>Nombre de preferencia</Text>
              <Text style={styles.preferenceDesc}>
                {preferences.preferredName
                  ? `Se te llama afectivamente «${preferences.preferredName}»`
                  : 'Usando nombre administrativo institucional'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.preferenceEditBtn}
              onPress={() => {
                setTempPreferredName(preferences.preferredName || '');
                setIsNameModalVisible(true);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Editar nombre de preferencia"
            >
              <Text style={styles.preferenceEditBtnText}>
                {preferences.preferredName ? 'Cambiar' : 'Definir'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Ambiente Visual (Temas con base científica para salud mental) */}
          <Text style={styles.preferenceSubHeader}>Ambiente visual relajante</Text>
          <Text style={styles.preferenceSubDesc}>
            Paletas cromáticas con base científica adaptadas a tu comodidad sensorial.
          </Text>

          <View style={styles.themeSelectorRow}>
            {/* Salvia / Bosque */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                preferences.visualTheme === 'salvia' && styles.themeOptionCardActiveSalvia,
              ]}
              onPress={() => void handleSelectTheme('salvia')}
              activeOpacity={0.85}
            >
              <View style={[styles.themeColorDot, { backgroundColor: '#86A789' }]} />
              <Text style={styles.themeOptionTitle}>Salvia</Text>
              <Text style={styles.themeOptionSub}>Armonía y calma</Text>
              {preferences.visualTheme === 'salvia' && (
                <View style={styles.themeActiveBadge}>
                  <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* Niebla / Océano */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                preferences.visualTheme === 'niebla' && styles.themeOptionCardActiveNiebla,
              ]}
              onPress={() => void handleSelectTheme('niebla')}
              activeOpacity={0.85}
            >
              <View style={[styles.themeColorDot, { backgroundColor: '#60A5FA' }]} />
              <Text style={styles.themeOptionTitle}>Niebla</Text>
              <Text style={styles.themeOptionSub}>Claridad mental</Text>
              {preferences.visualTheme === 'niebla' && (
                <View style={[styles.themeActiveBadge, { backgroundColor: '#2563EB' }]}>
                  <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>

            {/* Arena / Crema */}
            <TouchableOpacity
              style={[
                styles.themeOptionCard,
                preferences.visualTheme === 'arena' && styles.themeOptionCardActiveArena,
              ]}
              onPress={() => void handleSelectTheme('arena')}
              activeOpacity={0.85}
            >
              <View style={[styles.themeColorDot, { backgroundColor: '#E0A96D' }]} />
              <Text style={styles.themeOptionTitle}>Arena</Text>
              <Text style={styles.themeOptionSub}>Descanso cálido</Text>
              {preferences.visualTheme === 'arena' && (
                <View style={[styles.themeActiveBadge, { backgroundColor: '#D97706' }]}>
                  <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Frecuencia de Acompañamiento */}
          <Text style={styles.preferenceSubHeader}>Frecuencia de check-ins emocionales</Text>
          <Text style={styles.preferenceSubDesc}>
            Controla con qué ritmo deseas recibir invitaciones a reflexionar en tu diario.
          </Text>

          <View style={styles.frequencyRow}>
            <TouchableOpacity
              style={[
                styles.frequencyPill,
                preferences.checkInFrequency === 'low' && styles.frequencyPillActive,
              ]}
              onPress={() => void handleSelectFrequency('low')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.frequencyPillText,
                  preferences.checkInFrequency === 'low' && styles.frequencyPillTextActive,
                ]}
              >
                Baja
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.frequencyPill,
                preferences.checkInFrequency === 'moderate' && styles.frequencyPillActive,
              ]}
              onPress={() => void handleSelectFrequency('moderate')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.frequencyPillText,
                  preferences.checkInFrequency === 'moderate' && styles.frequencyPillTextActive,
                ]}
              >
                Moderada (Semanal)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.frequencyPill,
                preferences.checkInFrequency === 'high' && styles.frequencyPillActive,
              ]}
              onPress={() => void handleSelectFrequency('high')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.frequencyPillText,
                  preferences.checkInFrequency === 'high' && styles.frequencyPillTextActive,
                ]}
              >
                Solo en tensión
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clinical Care Team Card (Gestión y Contacto Directo) */}
        <Text style={styles.sectionLabel}>TU ACOMPAÑAMIENTO CLÍNICO</Text>
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
            onPress={() => router.push('/stats')}
            activeOpacity={0.7}
          >
            <Text style={styles.planActionText}>
              Ver Objetivos del Plan ({student?.activeGoalsCount || 3})
            </Text>
            <ChevronRightIcon size={14} color="#0F766E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appointmentRow}
            onPress={() => router.push('/stats')}
            activeOpacity={0.7}
          >
            <CalendarIcon size={14} color="#0284C7" />
            <Text style={styles.appointmentText}>
              {formatAppointmentDate(student?.nextAppointment?.appointmentDate)} · Ver agenda
            </Text>
            <ChevronRightIcon size={14} color="#0284C7" />
          </TouchableOpacity>
        </View>

        {/* NEXO BAND Hardware Card */}
        <Text style={styles.sectionLabel}>DISPOSITIVO VINCULADO</Text>
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleIndigo}>
              <WatchIcon size={20} color="#4F46E5" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardMainTitle}>NEXO BAND</Text>
              <Text style={styles.cardSubTitle}>
                {isBleConnected ? 'Pulsera Nexo · Bluetooth Activo' : 'Pulsera Nexo · Bluetooth Disponible'}
              </Text>
            </View>
            <View
              style={[
                styles.connectionPill,
                { backgroundColor: isBleConnected ? '#DCFCE7' : '#F1F5F9' },
              ]}
            >
              <View
                style={[
                  styles.connectionDot,
                  { backgroundColor: isBleConnected ? '#16A34A' : '#94A3B8' },
                ]}
              />
              <Text
                style={[
                  styles.connectionPillText,
                  { color: isBleConnected ? '#15803D' : '#64748B' },
                ]}
              >
                {isBleConnected ? 'Conectado en vivo' : 'Sincronizado'}
              </Text>
            </View>
          </View>

          {/* Live hardware feedback row */}
          <View style={styles.deviceFeedbackRow}>
            <View style={styles.feedbackItem}>
              <BatteryIcon size={15} color="#15803D" />
              <Text style={styles.feedbackText}>Batería: 85%</Text>
            </View>
            <View style={styles.feedbackItem}>
              <WatchIcon size={14} color="#64748B" />
              <Text style={styles.feedbackText}>Sensores calibrados</Text>
            </View>
            {!isBleConnected && (
              <View style={styles.demoBadgeMuted}>
                <Text style={styles.demoBadgeMutedText}>Modo Demo</Text>
              </View>
            )}
          </View>

          <View style={styles.cardDivider} />
          <TouchableOpacity
            style={styles.prototypeActionBtn}
            onPress={() => router.push('/esp32-prototype')}
            activeOpacity={0.8}
          >
            <Text style={styles.prototypeActionBtnText}>Ver Diagnóstico de Sensores</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy & Data Control Card */}
        <Text style={styles.sectionLabel}>PRIVACIDAD Y CONTROL DE DATOS</Text>
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <ShieldCheckIcon size={18} color="#10B981" />
            <Text style={styles.privacyTitle}>Almacenamiento Protegido y Confidencial</Text>
          </View>
          <Text style={styles.privacyText}>
            Tus reflexiones y registros biológicos permanecen cifrados únicamente
            en la memoria segura de tu dispositivo y solo se comparten con tu
            terapeuta bajo tu consentimiento explícito.
          </Text>
          <View style={styles.privacyTagsRow}>
            <View style={styles.privacyTag}>
              <LockIcon size={12} color="#047857" />
              <Text style={styles.privacyTagText}>Cifrado en Dispositivo</Text>
            </View>
            <View style={styles.privacyTag}>
              <Text style={styles.privacyTagText}>Control de Consentimiento</Text>
            </View>
            <View style={styles.privacyTag}>
              <Text style={styles.privacyTagText}>Retención Segura 48h</Text>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.accountSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => void logout()}
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

      {/* Modal para Nombre de Preferencia */}
      <Modal visible={isNameModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>¿Cómo quieres que te llamemos?</Text>
              <TouchableOpacity
                onPress={() => setIsNameModalVisible(false)}
                activeOpacity={0.7}
              >
                <CloseIcon size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalExplanation}>
              Personaliza tu nombre de pila o apodo favorito para que la app se comunique contigo de forma cercana y humana.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Javi, Mateo, Caro..."
              placeholderTextColor="#94A3B8"
              value={tempPreferredName}
              onChangeText={setTempPreferredName}
              autoFocus
              maxLength={24}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsNameModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => void handleSavePreferredName()}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveBtnText}>Guardar</Text>
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
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  preferenceDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  preferenceEditBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  preferenceEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  preferenceSubHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  preferenceSubDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  themeOptionCardActiveSalvia: {
    borderColor: '#86A789',
    backgroundColor: '#F3F7F4',
  },
  themeOptionCardActiveNiebla: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  themeOptionCardActiveArena: {
    borderColor: '#E0A96D',
    backgroundColor: '#FFFBEB',
  },
  themeColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 6,
  },
  themeOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  themeOptionSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  themeActiveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#86A789',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: Radius.medium,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  frequencyPillActive: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  frequencyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  frequencyPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  privacyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  privacyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  privacyTagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  privacyTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  modalExplanation: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: '#F8FAFC',
    marginBottom: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.medium,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.medium,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
