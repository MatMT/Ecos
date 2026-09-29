import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
  WatchIcon,
} from '@/components/ui/app-icons';
import {
  useStudent,
  type CheckInFrequency,
  type SimulationScenario,
  type VisualTheme,
} from '@/hooks/use-student';
import { useEsp32Ble } from '@/hooks/use-esp32-ble';
import { useTheme } from '@/context/theme-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useStudent();
  const { colors, setTheme } = useTheme();
  const { status: bleStatus } = useEsp32Ble();
  const isHardwareConnected = bleStatus === 'connected';

  const [preferredName, setPreferredName] = useState<string>(preferences.preferredName || '');
  const [selectedTheme, setSelectedTheme] = useState<VisualTheme>(preferences.visualTheme);
  const [selectedFrequency, setSelectedFrequency] = useState<CheckInFrequency>(preferences.checkInFrequency);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(preferences.demoMode ?? false);
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(preferences.simulationScenario ?? 'resting');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSelectTheme = (theme: VisualTheme) => {
    setSelectedTheme(theme);
    void setTheme(theme);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updatePreferences({
        preferredName: preferredName.trim() || undefined,
        visualTheme: selectedTheme,
        checkInFrequency: selectedFrequency,
        demoMode: isHardwareConnected ? false : isDemoMode,
        simulationScenario: selectedScenario,
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header con botón de volver */}
        <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver al perfil"
          >
            <ArrowLeftIcon size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ajustes y Preferencias</Text>
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
                onPress={() => handleSelectTheme('salvia')}
                activeOpacity={0.85}
              >
                <View style={[styles.themeColorCircle, { backgroundColor: '#0F766E' }]} />
                <View style={styles.themeInfoWrap}>
                  <Text style={styles.themeTitle}>Modo Salvia (Predeterminado)</Text>
                  <Text style={styles.themeSubtitle}>
                    Verde aqua sereno y luminoso, la identidad por defecto de Ecos.
                  </Text>
                </View>
                {selectedTheme === 'salvia' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#0F766E' }]}>
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
                onPress={() => handleSelectTheme('niebla')}
                activeOpacity={0.85}
              >
                <View style={[styles.themeColorCircle, { backgroundColor: '#5A7B9D' }]} />
                <View style={styles.themeInfoWrap}>
                  <Text style={styles.themeTitle}>Modo Niebla</Text>
                  <Text style={styles.themeSubtitle}>
                    Tonos azul pizarra para despejar la mente y enfocarte.
                  </Text>
                </View>
                {selectedTheme === 'niebla' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#5A7B9D' }]}>
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
                onPress={() => handleSelectTheme('arena')}
                activeOpacity={0.85}
              >
                <View style={[styles.themeColorCircle, { backgroundColor: '#9E866C' }]} />
                <View style={styles.themeInfoWrap}>
                  <Text style={styles.themeTitle}>Modo Arena</Text>
                  <Text style={styles.themeSubtitle}>
                    Tonos lino y avena suaves que ofrecen calidez sin fatigar la vista.
                  </Text>
                </View>
                {selectedTheme === 'arena' && (
                  <View style={[styles.checkCircle, { backgroundColor: '#9E866C' }]}>
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

          {/* Sección 4: Modo Simulación y Escenarios (Ecos Band) */}
          <View style={styles.card}>
            <View style={styles.switchHeaderRow}>
              <View style={styles.switchHeaderLeft}>
                <View style={styles.scenarioIconCircle}>
                  <WatchIcon size={20} color="#0D9488" />
                </View>
                <View style={styles.switchTextWrap}>
                  <Text style={styles.cardSectionTitle}>Modo Simulación (Ecos Band)</Text>
                  <Text style={styles.cardDescription}>
                    Genera telemetría lineal realista cuando no disponga de una pulsera física enlazada.
                  </Text>
                </View>
              </View>
              <Switch
                value={isHardwareConnected ? false : isDemoMode}
                disabled={isHardwareConnected}
                onValueChange={(val) => {
                  if (isHardwareConnected) return;
                  setIsDemoMode(val);
                  void updatePreferences({ demoMode: val });
                }}
                trackColor={{ false: '#CBD5E1', true: colors.brand }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isHardwareConnected && (
              <View style={styles.hardwareConnectedBanner}>
                <View style={styles.hardwareConnectedDot} />
                <Text style={styles.hardwareConnectedText}>
                  Pulsera Ecos Band conectada en vivo. La simulación y los escenarios fisiológicos están deshabilitados mientras el dispositivo físico esté transmitiendo datos reales.
                </Text>
              </View>
            )}

            {isDemoMode && !isHardwareConnected && (
              <View style={styles.scenariosContainer}>
                <Text style={styles.scenariosSubheading}>SELECCIONE EL ESCENARIO FISIOLÓGICO</Text>

                {/* Scenario 1: Reposo y Calma */}
                <TouchableOpacity
                  style={[
                    styles.scenarioCard,
                    selectedScenario === 'resting' && [
                      styles.scenarioCardActive,
                      { borderColor: colors.brand, backgroundColor: colors.brandLight },
                    ],
                  ]}
                  onPress={() => {
                    setSelectedScenario('resting');
                    void updatePreferences({ simulationScenario: 'resting' });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.scenarioCardHeader}>
                    <Text
                      style={[
                        styles.scenarioCardTitle,
                        selectedScenario === 'resting' && { color: colors.brand },
                      ]}
                    >
                      Reposo y Calma
                    </Text>
                    <View style={[styles.scenarioBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.scenarioBadgeText, { color: '#15803D' }]}>
                        68 - 74 BPM
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scenarioCardDesc}>
                    Frecuencia basal tranquila en reposo muscular con equilibrio autonómico estable.
                  </Text>
                </TouchableOpacity>

                {/* Scenario 2: Tensión Laboral */}
                <TouchableOpacity
                  style={[
                    styles.scenarioCard,
                    selectedScenario === 'work_stress' && [
                      styles.scenarioCardActive,
                      { borderColor: colors.brand, backgroundColor: colors.brandLight },
                    ],
                  ]}
                  onPress={() => {
                    setSelectedScenario('work_stress');
                    void updatePreferences({ simulationScenario: 'work_stress' });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.scenarioCardHeader}>
                    <Text
                      style={[
                        styles.scenarioCardTitle,
                        selectedScenario === 'work_stress' && { color: colors.brand },
                      ]}
                    >
                      Tensión Laboral / Académica
                    </Text>
                    <View style={[styles.scenarioBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.scenarioBadgeText, { color: '#B45309' }]}>
                        88 - 98 BPM
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scenarioCardDesc}>
                    Estrés cognitivo moderado prolongado con reducida movilidad corporal.
                  </Text>
                </TouchableOpacity>

                {/* Scenario 3: Ataque de Pánico */}
                <TouchableOpacity
                  style={[
                    styles.scenarioCard,
                    selectedScenario === 'panic_attack' && [
                      styles.scenarioCardActive,
                      { borderColor: '#DC2626', backgroundColor: '#FEE2E2' },
                    ],
                  ]}
                  onPress={() => {
                    setSelectedScenario('panic_attack');
                    void updatePreferences({ simulationScenario: 'panic_attack' });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.scenarioCardHeader}>
                    <Text
                      style={[
                        styles.scenarioCardTitle,
                        selectedScenario === 'panic_attack' && { color: '#DC2626' },
                      ]}
                    >
                      Ataque de Pánico / Desacople
                    </Text>
                    <View style={[styles.scenarioBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.scenarioBadgeText, { color: '#DC2626' }]}>
                        118 - 132 BPM
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scenarioCardDesc}>
                    Tensión autonómica aguda en reposo corporal: activa la alerta fisiológica en semáforo rojo.
                  </Text>
                </TouchableOpacity>

                {/* Scenario 4: Ejercicio Físico */}
                <TouchableOpacity
                  style={[
                    styles.scenarioCard,
                    selectedScenario === 'physical_exercise' && [
                      styles.scenarioCardActive,
                      { borderColor: colors.brand, backgroundColor: colors.brandLight },
                    ],
                  ]}
                  onPress={() => {
                    setSelectedScenario('physical_exercise');
                    void updatePreferences({ simulationScenario: 'physical_exercise' });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.scenarioCardHeader}>
                    <Text
                      style={[
                        styles.scenarioCardTitle,
                        selectedScenario === 'physical_exercise' && { color: colors.brand },
                      ]}
                    >
                      Ejercicio Físico / Caminata
                    </Text>
                    <View style={[styles.scenarioBadge, { backgroundColor: '#E0F2FE' }]}>
                      <Text style={[styles.scenarioBadgeText, { color: '#0369A1' }]}>
                        95 - 115 BPM
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scenarioCardDesc}>
                    Elevación cardiovascular por esfuerzo motor activo; adaptación fisiológica saludable.
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Sección 5: Privacidad y Confidencialidad */}
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
            style={[styles.saveButton, { backgroundColor: colors.brand }, isSaving && styles.saveButtonDisabled]}
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
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  themeItemActiveNiebla: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  themeItemActiveArena: {
    borderColor: '#9E866C',
    backgroundColor: '#F8F6F2',
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
  switchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scenarioIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTextWrap: {
    flex: 1,
  },
  hardwareConnectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.medium,
    padding: 12,
    marginTop: 14,
  },
  hardwareConnectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  hardwareConnectedText: {
    flex: 1,
    fontSize: 12,
    color: '#15803D',
    lineHeight: 17,
    fontWeight: '500',
  },
  scenariosContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  scenariosSubheading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scenarioCard: {
    padding: 12,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  scenarioCardActive: {
    backgroundColor: '#F0FDFA',
  },
  scenarioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  scenarioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  scenarioBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  scenarioCardDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
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
