import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/context/theme-context';
import { useStudent } from '@/hooks/use-student';
import { submitAppointmentRequest } from '@/services/storage/appointment-service';
import {
  CalendarIcon,
  CheckCircle2Icon,
  CloseIcon,
  UserCheckIcon,
} from '@/components/ui/app-icons';

interface DayOption {
  label: string;
  subLabel: string;
  dateIso: string;
}

interface TimeSlotOption {
  label: string;
  hour: number;
  minute: number;
}

const TIME_SLOTS: TimeSlotOption[] = [
  { label: '09:00 AM', hour: 9, minute: 0 },
  { label: '10:00 AM', hour: 10, minute: 0 },
  { label: '11:00 AM', hour: 11, minute: 0 },
  { label: '02:00 PM', hour: 14, minute: 0 },
  { label: '03:00 PM', hour: 15, minute: 0 },
  { label: '04:00 PM', hour: 16, minute: 0 },
];

function generateUpcomingDays(): DayOption[] {
  const options: DayOption[] = [];
  const now = new Date();

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  let addedDays = 0;
  let offset = 1;

  while (addedDays < 15) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dayOfWeek = candidate.getDay();

    // Exclude Sundays (0) for institutional clinical schedules
    if (dayOfWeek !== 0) {
      const dayName = dayNames[dayOfWeek];
      const monthName = monthNames[candidate.getMonth()];
      const dayNumber = candidate.getDate();

      options.push({
        label: addedDays === 0 ? 'Mañana' : `${dayName}, ${dayNumber}`,
        subLabel: `${dayNumber} ${monthName}`,
        dateIso: candidate.toISOString().split('T')[0],
      });
      addedDays++;
    }
    offset++;
  }

  return options;
}

function formatSelectedDaySummary(dateIso: string): string {
  const [y, m, d] = dateIso.split('-');
  const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalizedDay}, ${parseInt(d, 10)} de ${monthName}`;
}

export default function AppointmentRequestModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { student, refreshStudent } = useStudent();

  const upcomingDays = generateUpcomingDays();
  const [selectedDayIso, setSelectedDayIso] = useState<string>(upcomingDays[0].dateIso);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotOption>(TIME_SLOTS[0]);
  const [selectedModality, setSelectedModality] = useState<'in_person' | 'virtual'>('in_person');
  const [reasonText, setReasonText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const therapist = student?.assignedTherapist;

  const handleClose = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!student?.id) {
      Alert.alert(
        'Atención',
        'No se ha encontrado el perfil de estudiante. Verifique su sesión e intente nuevamente.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const [yearStr, monthStr, dayStr] = selectedDayIso.split('-');
      const scheduledDate = new Date(
        parseInt(yearStr, 10),
        parseInt(monthStr, 10) - 1,
        parseInt(dayStr, 10),
        selectedSlot.hour,
        selectedSlot.minute,
        0,
        0
      );

      const reason =
        reasonText.trim().length > 0
          ? reasonText.trim()
          : 'Solicitud de acompañamiento psicológico';

      await submitAppointmentRequest(
        {
          doctorId: therapist?.id,
          appointmentDate: scheduledDate.toISOString(),
          modality: selectedModality,
          reason,
        },
        therapist?.fullName
      );

      await refreshStudent().catch(() => {});

      Alert.alert(
        'Solicitud Registrada',
        `Su solicitud de cita ha sido remitida satisfactoriamente al equipo de ${
          therapist?.fullName || 'su terapeuta'
        }. Se encuentra en estado pendiente de confirmación.`,
        [
          {
            text: 'Aceptar',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ha ocurrido un error al procesar la solicitud de cita clínica.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screenContainer, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Solicitar Cita Clínica</Text>
          <Text style={styles.headerSubtitle}>
            Coordinación de sesión con su terapeuta asignado
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          activeOpacity={0.7}
          accessibilityLabel="Cerrar modal de solicitud de cita"
        >
          <CloseIcon size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Therapist Summary Card */}
        <View style={styles.therapistCard}>
          <View style={styles.therapistIconCircle}>
            <UserCheckIcon size={22} color="#0F766E" />
          </View>
          <View style={styles.therapistDetails}>
            <Text style={styles.therapistCardName}>
              {therapist?.fullName || 'Psic. Demo B1'}
            </Text>
            <Text style={styles.therapistCardSpecialty}>
              {therapist?.specialty || 'Psicología Clínica y de la Salud'}
            </Text>
            <Text style={styles.therapistCardStatus}>
              Acompañamiento institucional asignado
            </Text>
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <CalendarIcon size={16} color={colors.brand} />
            <Text style={styles.sectionHeading}>SELECCIONE LA FECHA SUGERIDA</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChipsRow}
          >
            {upcomingDays.map((day) => {
              const isSelected = selectedDayIso === day.dateIso;
              return (
                <TouchableOpacity
                  key={day.dateIso}
                  style={[
                    styles.dayChip,
                    isSelected && [
                      styles.dayChipActive,
                      { borderColor: colors.brand, backgroundColor: colors.brandLight },
                    ],
                  ]}
                  onPress={() => setSelectedDayIso(day.dateIso)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayChipLabel,
                      isSelected && { color: colors.brand, fontWeight: '700' },
                    ]}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayChipSub,
                      isSelected && { color: colors.brand, fontWeight: '600' },
                    ]}
                  >
                    {day.subLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.selectedDaySummaryWrap}>
            <Text style={styles.selectedDaySummaryText}>
              Fecha sugerida:{' '}
              <Text style={{ fontWeight: '700', color: colors.brand }}>
                {formatSelectedDaySummary(selectedDayIso)}
              </Text>
            </Text>
            <Text style={styles.selectedDayRangeNotice}>
              Ventana de 15 días hábiles disponible
            </Text>
          </View>
        </View>

        {/* Hour / Slot Selector */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>HORARIO PREFERIDO</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected =
                selectedSlot.hour === slot.hour && selectedSlot.minute === slot.minute;
              return (
                <TouchableOpacity
                  key={slot.label}
                  style={[
                    styles.slotButton,
                    isSelected && [
                      styles.slotButtonActive,
                      { borderColor: colors.brand, backgroundColor: colors.brandLight },
                    ],
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.slotButtonText,
                      isSelected && { color: colors.brand, fontWeight: '700' },
                    ]}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Modality Selector */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>MODALIDAD DE ATENCIÓN</Text>
          <View style={styles.modalityRow}>
            <TouchableOpacity
              style={[
                styles.modalityButton,
                selectedModality === 'in_person' && [
                  styles.modalityButtonActive,
                  { borderColor: colors.brand, backgroundColor: colors.brandLight },
                ],
              ]}
              onPress={() => setSelectedModality('in_person')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modalityButtonTitle,
                  selectedModality === 'in_person' && { color: colors.brand },
                ]}
              >
                Presencial
              </Text>
              <Text style={styles.modalityButtonSub}>Consultorio Institucional</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalityButton,
                selectedModality === 'virtual' && [
                  styles.modalityButtonActive,
                  { borderColor: colors.brand, backgroundColor: colors.brandLight },
                ],
              ]}
              onPress={() => setSelectedModality('virtual')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modalityButtonTitle,
                  selectedModality === 'virtual' && { color: colors.brand },
                ]}
              >
                Virtual
              </Text>
              <Text style={styles.modalityButtonSub}>Sesión Telemática Segura</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reason / Clinical Note */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>MOTIVO DE LA SOLICITUD (OPCIONAL)</Text>
          <TextInput
            style={styles.reasonInput}
            multiline
            numberOfLines={4}
            value={reasonText}
            onChangeText={setReasonText}
            placeholder="Describa brevemente el motivo de su solicitud (ej. seguimiento, manejo de estrés o dificultad específica)..."
            placeholderTextColor="#94A3B8"
            maxLength={400}
          />
          <Text style={styles.charCountText}>{reasonText.length}/400 caracteres</Text>
        </View>

        {/* Information Notice */}
        <View style={styles.noticeCard}>
          <CheckCircle2Icon size={16} color="#059669" />
          <Text style={styles.noticeText}>
            Las solicitudes se registran en estado «Pendiente» hasta la confirmación formal por parte del profesional tratante en su agenda clínica.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.brand }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Confirmar Solicitud de Cita</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  therapistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: Radius.large,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 20,
  },
  therapistIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  therapistDetails: {
    flex: 1,
  },
  therapistCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F766E',
  },
  therapistCardSpecialty: {
    fontSize: 12,
    color: '#115E59',
    marginTop: 2,
  },
  therapistCardStatus: {
    fontSize: 11,
    color: '#0D9488',
    marginTop: 3,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  horizontalChipsRow: {
    gap: 10,
    paddingVertical: 4,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.medium,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 90,
  },
  dayChipActive: {
    backgroundColor: '#F0FDFA',
  },
  dayChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dayChipSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  selectedDaySummaryWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
    flexWrap: 'wrap',
    gap: 4,
  },
  selectedDaySummaryText: {
    fontSize: 12,
    color: '#334155',
  },
  selectedDayRangeNotice: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: Radius.medium,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonActive: {
    backgroundColor: '#F0FDFA',
  },
  slotButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalityButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radius.medium,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modalityButtonActive: {
    backgroundColor: '#F0FDFA',
  },
  modalityButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalityButtonSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  reasonInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCountText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  submitButton: {
    height: 50,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
