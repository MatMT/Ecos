import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  LockIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  WatchIcon,
} from '@/components/ui/app-icons';
import { useAuth } from '@/hooks/use-auth';
import { useBiometricMonitor } from '@/hooks/use-biometric-monitor';

function formatDisplayName(email: string | undefined): string {
  if (!email) return 'Estudiante Ecos';
  const localPart = email.split('@')[0];
  const parts = localPart.split('.');
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isBleConnected } = useBiometricMonitor();

  const displayName = formatDisplayName(user?.email);
  const userInitial = displayName.charAt(0).toUpperCase();

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
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{user?.email ?? 'usuario@ecos.local'}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.carnetBadge}>
                  <Text style={styles.carnetText}>Carnet: UDB-2024-0491</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.statusText}>Estudiante Activo</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.institutionDivider} />
          <View style={styles.institutionRow}>
            <Text style={styles.institutionLabel}>Institución:</Text>
            <Text style={styles.institutionValue}>Universidad Don Bosco</Text>
          </View>
        </View>

        {/* Clinical Care Team Card */}
        <Text style={styles.sectionLabel}>TU ACOMPAÑAMIENTO CLÍNICO</Text>
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleTeal}>
              <UserCheckIcon size={20} color="#0F766E" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardMainTitle}>Dr. Carlos Méndez</Text>
              <Text style={styles.cardSubTitle}>Psicólogo Clínico Especialista · Colegiado 4920</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Enfoque terapéutico:</Text>
            <Text style={styles.detailVal}>Manejo de Estrés y Ansiedad Académica</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Plan de atención:</Text>
            <Text style={styles.detailValGreen}>Activo · 3 metas en curso</Text>
          </View>
        </View>

        {/* ECOS BAND Hardware Card */}
        <Text style={styles.sectionLabel}>DISPOSITIVO VINCULADO</Text>
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleIndigo}>
              <WatchIcon size={20} color="#4F46E5" />
            </View>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardMainTitle}>ECOS BAND</Text>
              <Text style={styles.cardSubTitle}>Pulsera BLE · Monitor Biométrico ESP32</Text>
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
                {isBleConnected ? 'Enlazada' : 'Modo Demo'}
              </Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <TouchableOpacity
            style={styles.prototypeActionBtn}
            onPress={() => router.push('/esp32-prototype')}
            activeOpacity={0.8}
          >
            <Text style={styles.prototypeActionBtnText}>Abrir Monitor de Telemetría ESP32</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy & SQLite Security Card */}
        <Text style={styles.sectionLabel}>PRIVACIDAD Y DATOS (SHAPE C)</Text>
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <ShieldCheckIcon size={18} color="#10B981" />
            <Text style={styles.privacyTitle}>Almacenamiento Local Seguro</Text>
          </View>
          <Text style={styles.privacyText}>
            Tus reflexiones personales y lecturas biométricas de alta frecuencia
            están cifradas en la base de datos local SQLite de tu teléfono. Solo
            se comparten con tu terapeuta cuando tú lo decides explícitamente.
          </Text>
          <View style={styles.privacyTagsRow}>
            <View style={styles.privacyTag}>
              <LockIcon size={12} color="#047857" />
              <Text style={styles.privacyTagText}>Cifrado en Dispositivo</Text>
            </View>
            <View style={styles.privacyTag}>
              <Text style={styles.privacyTagText}>Retención 48h</Text>
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
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
          <Text style={styles.appVersionText}>
            ECOS Mobile · Versión 1.0.0 · Universidad Don Bosco
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
    fontWeight: '700',
    color: '#15803D',
  },
  institutionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  institutionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  institutionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  institutionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: 16,
    marginBottom: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircleTeal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleIndigo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSubTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.pill,
    gap: 5,
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
  cardDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailKey: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  detailValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  prototypeActionBtn: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: Radius.small,
    paddingVertical: 10,
    alignItems: 'center',
  },
  prototypeActionBtnText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 13,
  },
  privacyCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.medium,
    padding: 16,
    marginBottom: 24,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  privacyText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
  privacyTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.small,
    gap: 4,
  },
  privacyTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  accountSection: {
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.medium,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
  appVersionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

