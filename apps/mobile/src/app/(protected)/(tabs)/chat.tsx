import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomTopBar from '@/components/custom-top-bar';
import { Colors, Radius } from '@/constants/theme';
import {
  AnxietyPulseIcon,
  BookOpenIcon,
  CheckIcon,
  CloseIcon,
  CloudRainIcon,
  HeartIcon,
  LeafIcon,
  LockIcon,
  MoodHappyIcon,
  MoodNeutralIcon,
  MoodSadIcon,
  MoodVeryHappyIcon,
  MoodVerySadIcon,
  PlusIcon,
  SparklesIcon,
  WatchIcon,
  ZapIcon,
} from '@/components/ui/app-icons';
import { useAuth } from '@/hooks/use-auth';
import { useStudent } from '@/hooks/use-student';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';
import {
  listJournalEntries,
  createJournalEntry,
  markJournalEntryShared,
} from '@/services/storage/journal-service';
import type { LocalJournalEntry } from '@/services/storage/local-db';
import { enqueueSync } from '@/services/storage/local-db';
import { authClient } from '@/services/api/auth-client';

function greetingNameFrom(email: string | undefined): string {
  if (!email) return 'Laura';
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

interface MoodOption {
  score: number;
  label: string;
  color: string;
  colorActive: string;
  bgLight: string;
  bgActive: string;
  borderLight: string;
  borderActive: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    score: 1,
    label: 'Muy mal',
    color: '#E05252',
    colorActive: '#DC2626',
    bgLight: '#FFF8F8',
    bgActive: '#FEE2E2',
    borderLight: '#FCE7E7',
    borderActive: '#EF4444',
  },
  {
    score: 2,
    label: 'Mal',
    color: '#D9822B',
    colorActive: '#B45309',
    bgLight: '#FFFCF5',
    bgActive: '#FEF3C7',
    borderLight: '#FEF3D6',
    borderActive: '#F59E0B',
  },
  {
    score: 3,
    label: 'Regular',
    color: '#64748B',
    colorActive: '#334155',
    bgLight: '#F8FAFC',
    bgActive: '#F1F5F9',
    borderLight: '#E2E8F0',
    borderActive: '#64748B',
  },
  {
    score: 4,
    label: 'Bien',
    color: '#10B981',
    colorActive: '#047857',
    bgLight: '#F4FDF7',
    bgActive: '#DCFCE7',
    borderLight: '#DCFCE7',
    borderActive: '#16A34A',
  },
  {
    score: 5,
    label: 'Excelente',
    color: '#14B8A6',
    colorActive: '#0F766E',
    bgLight: '#F2FCFB',
    bgActive: '#CCFBF1',
    borderLight: '#CCFBF1',
    borderActive: '#0D9488',
  },
];

function renderMoodIcon(score: number, size = 26, isSelected = false) {
  const opt = MOOD_OPTIONS.find((m) => m.score === score);
  const color = opt ? (isSelected ? opt.colorActive : opt.color) : '#64748B';
  switch (score) {
    case 1:
      return <MoodVerySadIcon size={size} color={color} />;
    case 2:
      return <MoodSadIcon size={size} color={color} />;
    case 3:
      return <MoodNeutralIcon size={size} color={color} />;
    case 4:
      return <MoodHappyIcon size={size} color={color} />;
    case 5:
    default:
      return <MoodVeryHappyIcon size={size} color={color} />;
  }
}

interface EmotionOption {
  key: string;
  label: string;
  color: string;
  bgLight: string;
  bgActive: string;
  borderLight: string;
  borderActive: string;
}

const EMOTIONS: EmotionOption[] = [
  {
    key: 'ansiedad',
    label: 'Ansiedad',
    color: '#D97706',
    bgLight: '#FFFBEB',
    bgActive: '#FEF3C7',
    borderLight: '#FDE68A',
    borderActive: '#F59E0B',
  },
  {
    key: 'tristeza',
    label: 'Tristeza',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    bgActive: '#DBEAFE',
    borderLight: '#BFDBFE',
    borderActive: '#3B82F6',
  },
  {
    key: 'calma',
    label: 'Calma',
    color: '#059669',
    bgLight: '#ECFDF5',
    bgActive: '#D1FAE5',
    borderLight: '#A7F3D0',
    borderActive: '#10B981',
  },
  {
    key: 'estres',
    label: 'Estrés',
    color: '#DC2626',
    bgLight: '#FEF2F2',
    bgActive: '#FEE2E2',
    borderLight: '#FECACA',
    borderActive: '#EF4444',
  },
  {
    key: 'motivacion',
    label: 'Motivación',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    bgActive: '#EDE9FE',
    borderLight: '#DDD6FE',
    borderActive: '#8B5CF6',
  },
];

function renderEmotionIcon(key: string, size = 16, isSelected = false) {
  const e = EMOTIONS.find((item) => item.key === key);
  const color = isSelected && e ? e.color : '#64748B';
  switch (key) {
    case 'ansiedad':
      return <AnxietyPulseIcon size={size} color={color} />;
    case 'tristeza':
      return <CloudRainIcon size={size} color={color} />;
    case 'calma':
      return <LeafIcon size={size} color={color} />;
    case 'estres':
      return <ZapIcon size={size} color={color} />;
    case 'motivacion':
    default:
      return <SparklesIcon size={size} color={color} />;
  }
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { student } = useStudent();
  const { bpm, stress, isBleConnected, trafficState } = useBiometricMonitor();

  // Journal Entries State
  const [journalEntries, setJournalEntries] = useState<LocalJournalEntry[]>([]);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);

  // Form State for New Entry
  const [newMoodScore, setNewMoodScore] = useState<number>(4);
  const [newEmotion, setNewEmotion] = useState<string>('calma');
  const [newNarrative, setNewNarrative] = useState<string>('');
  const [showBiometricTooltip, setShowBiometricTooltip] = useState(false);

  const refreshJournal = useCallback(async () => {
    try {
      const entries = await listJournalEntries();
      setJournalEntries(entries);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    let active = true;
    listJournalEntries()
      .then((entries) => {
        if (active) {
          setJournalEntries(entries);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleSaveEntry = async () => {
    if (!newNarrative.trim()) {
      Alert.alert(
        'Atención',
        'Por favor, escriba una breve reflexión para registrar su entrada.'
      );
      return;
    }

    try {
      await createJournalEntry({
        moodScore: newMoodScore,
        primaryEmotion: newEmotion,
        narrativeText: newNarrative.trim(),
        associatedBpm: bpm,
        associatedStress: stress,
      });

      setNewNarrative('');
      setNewMoodScore(4);
      setNewEmotion('calma');
      setShowBiometricTooltip(false);
      setShowNewEntryModal(false);
      await refreshJournal();
    } catch {
      Alert.alert('Error', 'Ha ocurrido un error al guardar su reflexión local.');
    }
  };

  const handleShareWithTherapist = (entry: LocalJournalEntry) => {
    const therapistName = student?.assignedTherapist?.fullName || 'su terapeuta asignado';
    Alert.alert(
      'Compartir con su terapeuta',
      `¿Desea compartir esta reflexión con ${therapistName}? Esta acción creará una copia inmutable visible para su psicólogo en su expediente clínico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Compartir',
          onPress: async () => {
            if (!student?.id) {
              Alert.alert(
                'Atención',
                'No se ha podido identificar su expediente de estudiante. Por favor, verifique su conexión e intente nuevamente.'
              );
              return;
            }

            const snapshotId = `snap_${Date.now()}`;
            try {
              await markJournalEntryShared(entry.id, snapshotId);

              const payload = {
                therapistId: student.assignedTherapist?.id,
                contentType: 'journal_entry',
                sourceLocalId: entry.id,
                content: `[Emoción: ${entry.primary_emotion}, Ánimo: ${entry.mood_score}/5, FC: ${entry.associated_bpm ?? '--'} bpm]\n${entry.narrative_text}`,
              };

              const endpoint = `/api/v1/students/${student.id}/shared-content`;

              authClient
                .apiFetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                })
                .catch(() => {
                  return enqueueSync(endpoint, payload);
                });

              await refreshJournal();
              Alert.alert('Éxito', 'Su reflexión ha sido compartida confidencialmente con su terapeuta.');
            } catch {
              Alert.alert('Aviso', 'Se ha programado el envío para cuando se restablezca la conexión.');
            }
          },
        },
      ]
    );
  };

  // Subtle Biometric Chip State
  const isAgitated = trafficState === 'RED' || (bpm != null && bpm > 95) || (stress != null && stress > 40);

  const biometricPillConfig = isBleConnected
    ? isAgitated
      ? {
          bg: '#FEF3C7',
          textColor: '#92400E',
          borderColor: '#FDE68A',
          text: 'ECOS BAND conectada  ·  Ritmo acelerado',
          detail: `Frecuencia cardíaca: ${bpm} bpm · Estrés estimado: ${stress}%`,
        }
      : {
          bg: '#F1F5F9',
          textColor: '#475569',
          borderColor: '#E2E8F0',
          text: 'ECOS BAND conectada  ·  Fisiología en calma',
          detail: `Frecuencia cardíaca: ${bpm} bpm · Estrés estimado: ${stress}%`,
        }
    : {
        bg: '#F1F5F9',
        textColor: '#475569',
        borderColor: '#E2E8F0',
        text: 'ECOS BAND en reposo  ·  Registro manual',
        detail: `Modo continuo · Lectura estimada: ${bpm ?? 72} bpm`,
      };

  const displayName = student?.fullName || greetingNameFrom(user?.email);

  return (
    <View style={styles.mainContainer}>
      <CustomTopBar name={displayName} />

      {/* Screen Subheader */}
      <View style={styles.subHeader}>
        <View style={styles.subHeaderLeft}>
          <Text style={styles.screenTitle}>Tu Espacio Personal</Text>
          <View style={styles.privacyBadge}>
            <LockIcon size={12} color="#64748B" />
            <Text style={styles.privacyBadgeText}>
              Privado · Almacenado solo en tu teléfono
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={() => setShowNewEntryModal(true)}
          activeOpacity={0.85}
        >
          <PlusIcon size={13} color="#FFFFFF" />
          <Text style={styles.newEntryButtonText}>Escribir</Text>
        </TouchableOpacity>
      </View>

      {/* Entries List or Clean Empty State */}
      {journalEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <BookOpenIcon size={36} color={Colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes entradas registradas</Text>
          <Text style={styles.emptySubtitle}>
            Tómate un momento para expresar tus pensamientos y emociones del día con total privacidad.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => setShowNewEntryModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyActionButtonText}>Escribir primera reflexión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={journalEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const emotionObj = EMOTIONS.find((e) => e.key === item.primary_emotion);
            const moodObj = MOOD_OPTIONS.find((m) => m.score === item.mood_score);
            const isShared = item.is_shared_with_therapist === 1;

            return (
              <View style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryEmotionTag}>
                    {renderEmotionIcon(item.primary_emotion, 15, true)}
                    <Text style={styles.entryEmotionLabel}>
                      {emotionObj?.label ?? item.primary_emotion}
                    </Text>
                    <Text style={styles.entryMoodDot}>·</Text>
                    {renderMoodIcon(item.mood_score, 17, true)}
                    <Text style={styles.entryMoodScore}>
                      {moodObj?.label ?? `${item.mood_score}/5`}
                    </Text>
                  </View>
                  <Text style={styles.entryDate}>
                    {new Date(item.created_at ?? '').toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>

                <Text style={styles.entryNarrative}>{item.narrative_text}</Text>

                {item.associated_bpm != null && (
                  <View style={styles.entryBiometricStamp}>
                    <WatchIcon size={12} color="#64748B" />
                    <Text style={styles.entryBiometricText}>
                      ECOS BAND ·
                    </Text>
                    <HeartIcon size={11} color="#DC2626" />
                    <Text style={styles.entryBiometricText}>
                      {item.associated_bpm} bpm
                      {item.associated_stress != null ? ` · ${item.associated_stress}% estrés` : ''}
                    </Text>
                  </View>
                )}

                <View style={styles.entryFooter}>
                  {isShared ? (
                    <View style={styles.sharedBadge}>
                      <CheckIcon size={12} color="#15803D" />
                      <Text style={styles.sharedBadgeText}>
                        {student?.assignedTherapist?.fullName
                          ? `Compartido con ${student.assignedTherapist.fullName}`
                          : 'Compartido con terapeuta'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleShareWithTherapist(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.shareButtonText}>Compartir con terapeuta</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal de Entrada ("+ Escribir") */}
      <Modal visible={showNewEntryModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Reflexión</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowNewEntryModal(false)}
                activeOpacity={0.7}
              >
                <CloseIcon size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Question 1: Mood Score */}
              <Text style={styles.formSectionLabel}>¿Cómo te sientes en este momento?</Text>
              <View style={styles.moodSelectorRow}>
                {MOOD_OPTIONS.map((opt) => {
                  const isSelected = newMoodScore === opt.score;
                  return (
                    <TouchableOpacity
                      key={opt.score}
                      style={[
                        styles.moodOptionButton,
                        {
                          backgroundColor: isSelected ? opt.bgActive : opt.bgLight,
                          borderColor: isSelected ? opt.borderActive : opt.borderLight,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setNewMoodScore(opt.score)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.moodIconWrapper}>
                        {renderMoodIcon(opt.score, 28, isSelected)}
                      </View>
                      <Text
                        style={[
                          styles.moodLabel,
                          {
                            color: isSelected ? opt.colorActive : opt.color,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Question 2: Predominant Emotion */}
              <Text style={styles.formSectionLabel}>Emoción predominante</Text>
              <View style={styles.emotionsWrap}>
                {EMOTIONS.map((e) => {
                  const isSelected = newEmotion === e.key;
                  return (
                    <TouchableOpacity
                      key={e.key}
                      style={[
                        styles.emotionPill,
                        isSelected
                          ? {
                              backgroundColor: e.bgActive,
                              borderColor: e.borderActive,
                              borderWidth: 1.5,
                            }
                          : {
                              backgroundColor: '#F8FAFC',
                              borderColor: '#E2E8F0',
                              borderWidth: 1,
                            },
                      ]}
                      onPress={() => setNewEmotion(e.key)}
                      activeOpacity={0.75}
                    >
                      {renderEmotionIcon(e.key, 16, isSelected)}
                      <Text
                        style={[
                          styles.emotionPillLabel,
                          {
                            color: isSelected ? e.color : '#64748B',
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {e.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Question 3: Narrative Text */}
              <Text style={styles.formSectionLabel}>
                Escribe tus pensamientos o reflexiones
              </Text>
              <TextInput
                style={styles.narrativeTextInput}
                placeholder="Hoy me sentí un poco abrumado cuando..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={5}
                value={newNarrative}
                onChangeText={setNewNarrative}
              />

              {/* Subtle Biometric Chip (Pill) */}
              <TouchableOpacity
                style={[
                  styles.biometricPill,
                  {
                    backgroundColor: biometricPillConfig.bg,
                    borderColor: biometricPillConfig.borderColor,
                  },
                ]}
                onPress={() => setShowBiometricTooltip((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={styles.biometricPillContent}>
                  <WatchIcon size={16} color={biometricPillConfig.textColor} />
                  <Text
                    style={[
                      styles.biometricPillText,
                      { color: biometricPillConfig.textColor },
                    ]}
                  >
                    {biometricPillConfig.text}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Optional Subtle Tooltip */}
              {showBiometricTooltip && (
                <View style={styles.tooltipCard}>
                  <Text style={styles.tooltipText}>{biometricPillConfig.detail}</Text>
                </View>
              )}

              {/* Save Action */}
              <TouchableOpacity
                style={styles.saveEntryButton}
                onPress={handleSaveEntry}
                activeOpacity={0.85}
              >
                <Text style={styles.saveEntryButtonText}>Guardar en mi diario</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  subHeaderLeft: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },
  privacyBadgeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    elevation: 2,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 6,
  },
  newEntryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionButton: {
    backgroundColor: '#E6F7F5',
    borderWidth: 1,
    borderColor: '#A7E3DC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
  emptyActionButtonText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 14,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryEmotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryEmotionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand,
    textTransform: 'uppercase',
  },
  entryMoodDot: {
    fontSize: 12,
    color: '#94A3B8',
  },
  entryMoodScore: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  entryDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  entryNarrative: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  entryBiometricStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.small,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  entryBiometricText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  entryFooter: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 10,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.small,
    alignSelf: 'flex-start',
    gap: 6,
  },
  sharedBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.small,
    alignSelf: 'flex-start',
  },
  shareButtonText: {
    color: Colors.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: 'bold',
  },
  modalScroll: {
    gap: 14,
  },
  formSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  moodSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  moodOptionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.medium,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  moodOptionButtonActive: {
    backgroundColor: '#E6F7F5',
    borderColor: Colors.brand,
  },
  moodIconWrapper: {
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  moodLabelActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  emotionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  emotionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emotionPillActive: {
    backgroundColor: '#E6F7F5',
    borderColor: Colors.brand,
  },
  emotionPillLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  emotionPillLabelActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  narrativeTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    lineHeight: 20,
  },
  biometricPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  biometricPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  biometricPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.small,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: -6,
  },
  tooltipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  saveEntryButton: {
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    borderRadius: Radius.large,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveEntryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
