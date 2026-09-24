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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Radius } from '@/constants/theme';
import {
  ArrowLeftIcon,
  CheckIcon,
  LockIcon,
  ShieldCheckIcon,
} from '@/components/ui/app-icons';
import { useStudent, type CheckInFrequency, type VisualTheme } from '@/hooks/use-student';

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useStudent();

  const [preferredName, setPreferredName] = useState<string>(preferences.preferredName || '');
  const [selectedTheme, setSelectedTheme] = useState<VisualTheme>(preferences.visualTheme);
  const [selectedFrequency, setSelectedFrequency] = useState<CheckInFrequency>(preferences.checkInFrequency);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updatePreferences({
        preferredName: preferredName.trim() || undefined,
        visualTheme: selectedTheme,
        checkInFrequency: selectedFrequency,
      });
      Alert.alert(
        'Preferencias guardadas',
        'Tus ajustes han sido actualizados y sincronizados con tu dispositivo.',
        [{ text: 'Entendido', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'No se pudieron guardar las preferencias.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header con botón de volver */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver al perfil"
          >
            <ArrowLeftIcon size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajustes y Preferencias</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sección 1: Nombre de Preferencia */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>¿Cómo quieres que te llamemos?</Text>
            <Text style={styles.cardDescription}>
              Personaliza tu nombre de pila para que la app se comunique contigo de forma cercana y humana.
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="Ej: Javi, Mateo, Sofi..."
              placeholderTextColor="#94A3B8"
              value={preferredName}
              onChangeText={setPreferredName}
              maxLength={24}
              returnKeyType="done"
            />
          </View>

          {/* Sección 2: Ambiente Visual */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Ambiente visual relajante</Text>
            <Text style={styles.cardDescription}>
              Tonos visuales suaves para descansar la vista y sentirte a gusto.
            </Text>

            <View style={styles.themeList}>
              {/* Tema Salvia */}
              <TouchableOpacity
                style={[
                  styles.themeItem,
                  selectedTheme === 'salvia' && styles.themeItemActiveSalvia,
                ]}
                onPress={() => setSelectedTheme('salvia')}
                activeOpacity={0.85}
              >
                <View style={[styles.themeColorCircle, { backgroundColor: '#86A789' }]} />
                <View style={styles.themeInfoWrap}>
                  <Text style={styles.themeTitle}>Modo Salvia</Text>
                  <Text style={styles.themeSubtitle}>
                    Tonos verdes suaves que transmiten calma y ayudan a descansar.
                  </Text>
                </View>
                {selectedTheme === 'salvia' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#86A789' }]}>
                    <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Tema Niebla */}
              <TouchableOpacity
                style={[
                  styles.themeItem,
                  selectedTheme === 'niebla' && styles.themeItemActiveNiebla,
                ]}
                onPress={() => setSelectedTheme('niebla')}
                activeOpacity={0.85}
              >
                <View style={[styles.themeColorCircle, { backgroundColor: '#60A5FA' }]} />
                <View style={styles.themeInfoWrap}>
                  <Text style={styles.themeTitle}>Modo Niebla</Text>
                  <Text style={styles.themeSubtitle}>
                    Tonos azul pizarra para despejar la mente y enfocarte.
                  </Text>
                </View>
                {selectedTheme === 'niebla' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#2563EB' }]}>
                    <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Tema Arena */}
              <TouchableOpacity
                style={[
                  styles.themeItem,
                  selectedTheme === 'arena' && styles.themeItemActiveArena,
                ]}
                onPress={() => setSelectedTheme('arena')}
                activeOpacity={0.85}
              >
                <View style={[styles.themeColorCircle, { backgroundColor: '#E0A96D' }]} />
                <View style={styles.themeInfoWrap}>
                  <Text style={styles.themeTitle}>Modo Arena</Text>
                  <Text style={styles.themeSubtitle}>
                    Tonos cálidos y acogedores para relajar la vista.
                  </Text>
                </View>
                {selectedTheme === 'arena' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#D97706' }]}>
                    <CheckIcon size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección 3: Recordatorios del Diario */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Recordatorios del diario</Text>
            <Text style={styles.cardDescription}>
              ¿Con qué frecuencia quieres que te preguntemos cómo estás?
            </Text>

            <View style={styles.frequencyGroup}>
              <TouchableOpacity
                style={[
                  styles.frequencyOption,
                  selectedFrequency === 'low' && styles.frequencyOptionActive,
                ]}
                onPress={() => setSelectedFrequency('low')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    selectedFrequency === 'low' && styles.frequencyTextActive,
                  ]}
                >
                  Baja (Quincenal)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.frequencyOption,
                  selectedFrequency === 'moderate' && styles.frequencyOptionActive,
                ]}
                onPress={() => setSelectedFrequency('moderate')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    selectedFrequency === 'moderate' && styles.frequencyTextActive,
                  ]}
                >
                  Semanal (Recomendado)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.frequencyOption,
                  selectedFrequency === 'high' && styles.frequencyOptionActive,
                ]}
                onPress={() => setSelectedFrequency('high')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    selectedFrequency === 'high' && styles.frequencyTextActive,
                  ]}
                >
                  Solo en tensión
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección 4: Privacidad y Confidencialidad */}
          <View style={styles.privacyBox}>
            <View style={styles.privacyHeaderRow}>
              <ShieldCheckIcon size={18} color="#10B981" />
              <Text style={styles.privacyTitle}>Privacidad en Dispositivo</Text>
            </View>
            <Text style={styles.privacyBody}>
              Tus preferencias y registros permanecen cifrados localmente en tu teléfono y bajo tu control absoluto.
            </Text>
            <View style={styles.lockBadge}>
              <LockIcon size={12} color="#0D9488" />
              <Text style={styles.lockBadgeText}>Almacenamiento seguro verificado</Text>
            </View>
          </View>

          {/* Botón Guardar Preferencias */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            disabled={isSaving}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Guardar preferencias y volver"
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Guardando...' : 'Guardar Preferencias'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  themeList: {
    gap: 10,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  themeItemActiveSalvia: {
    borderColor: '#86A789',
    backgroundColor: '#F3F7F4',
  },
  themeItemActiveNiebla: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  themeItemActiveArena: {
    borderColor: '#E0A96D',
    backgroundColor: '#FFFBEB',
  },
  themeColorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  themeInfoWrap: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
  },
  themeSubtitle: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 1,
    lineHeight: 15,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyGroup: {
    gap: 8,
  },
  frequencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  frequencyOptionActive: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  frequencyTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  privacyBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: Radius.medium,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 20,
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  privacyBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginBottom: 8,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lockBadgeText: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0D9488',
    paddingVertical: 15,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
