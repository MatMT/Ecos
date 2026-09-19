import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import CustomTopBar from '@/components/custom-top-bar';
import { Colors, Radius } from '@/constants/theme';
import {
  ArrowDownIcon,
  GearIcon,
  HeartIcon,
  MessageSquareIcon,
  MoonIcon,
  PhoneIcon,
  StarIcon,
} from '@/components/ui/app-icons';
import { useAuth } from '@/hooks/use-auth';

function greetingNameFrom(email: string | undefined): string {
  if (!email) return 'Usuario';
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

interface WeeklyDataPoint {
  day: string;
  minutesHighStress: number;
}

const WEEKLY_DATA: WeeklyDataPoint[] = [
  { day: 'L', minutesHighStress: 45 },
  { day: 'M', minutesHighStress: 70 },
  { day: 'M', minutesHighStress: 35 },
  { day: 'J', minutesHighStress: 15 },
  { day: 'V', minutesHighStress: 25 },
  { day: 'S', minutesHighStress: 55 },
  { day: 'D', minutesHighStress: 20 },
];

export default function Stats() {
  const { user } = useAuth();

  const handleWhatsApp = () => {
    void Linking.openURL('https://wa.me/50370000000?text=Hola%20Dr.%20Méndez,%20le%20contacto%20desde%20Ecos.');
  };

  const handleCall = () => {
    void Linking.openURL('tel:+50322744444');
  };

  const maxBarValue = 80;
  const barChartHeight = 110;

  return (
    <View style={styles.mainContainer}>
      <CustomTopBar name={greetingNameFrom(user?.email)} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tu Evolución</Text>
          <Text style={styles.subtitle}>
            Has logrado reducir tus picos de estrés un 14% esta semana. ¡Buen trabajo!
          </Text>
        </View>

        {/* Weekly Histogram Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>FRECUENCIA SEMANAL DE ESTRÉS</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>Tendencia: Favorable</Text>
              <ArrowDownIcon size={12} color="#15803D" />
            </View>
          </View>
          <Text style={styles.chartCaption}>Minutos registrados en estrés alto por día</Text>

          <View style={styles.histogramWrapper}>
            <Svg height="140" width="100%" viewBox="0 0 320 140">
              {WEEKLY_DATA.map((item, index) => {
                const barWidth = 26;
                const spacing = (320 - barWidth * 7) / 8;
                const x = spacing + index * (barWidth + spacing);
                const height = (item.minutesHighStress / maxBarValue) * barChartHeight;
                const y = 110 - height;
                const isSelected = item.day === 'J'; // e.g. lowest day

                return (
                  <React.Fragment key={item.day + index}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx={6}
                      fill={isSelected ? '#10B981' : item.minutesHighStress > 50 ? '#F87171' : '#38BDF8'}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y="130"
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
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>SESIONES CLÍNICAS RECIENTES</Text>
          <View style={styles.sessionItem}>
            <View style={styles.sessionIconCircle}>
              <StarIcon size={16} color="#0284C7" />
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
        </View>

        {/* Assigned Therapist Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>TU TERAPEUTA ASIGNADO</Text>
          <View style={styles.therapistInfo}>
            <View style={styles.therapistAvatar}>
              <Text style={styles.therapistInitials}>CM</Text>
            </View>
            <View style={styles.therapistTextContainer}>
              <Text style={styles.therapistName}>Dr. Carlos Méndez</Text>
              <Text style={styles.therapistRole}>Psicólogo Clínico Especialista</Text>
              <Text style={styles.therapistSub}>Colegiado No. 4920 · Clínica Central</Text>
            </View>
          </View>

          <View style={styles.therapistActions}>
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <MessageSquareIcon size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonPrimaryText}>Contactar por WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <PhoneIcon size={16} color={Colors.text} />
              <Text style={styles.actionButtonSecondaryText}>Llamada Directa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Metric Pills */}
        <View style={styles.pillsRow}>
          <View style={styles.pillCard}>
            <View style={styles.pillIconWrap}>
              <MoonIcon size={20} color="#6366F1" />
            </View>
            <View>
              <Text style={styles.pillLabel}>Calidad Sueño</Text>
              <Text style={styles.pillValue}>Muy buena (8h)</Text>
            </View>
          </View>

          <View style={styles.pillCard}>
            <View style={styles.pillIconWrap}>
              <HeartIcon size={20} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.pillLabel}>Pulso en Reposo</Text>
              <Text style={styles.pillValue}>Estable (68 bpm)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.small,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  chartCaption: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  histogramWrapper: {
    alignItems: 'center',
    marginVertical: 6,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sessionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sessionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sessionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  therapistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  therapistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  therapistInitials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  therapistTextContainer: {
    flex: 1,
  },
  therapistName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
  },
  therapistRole: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  therapistSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  therapistActions: {
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtonSecondary: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonSecondaryText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pillCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    width: '48%',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  pillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pillLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pillValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
});
