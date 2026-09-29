import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { InfoIcon, MoonIcon } from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function SleepMonitoringCard() {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <MoonIcon size={20} color="#0F766E" />
          </View>
          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>Detección Automática de Descanso</Text>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setShowInfoModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Información sobre la detección de sueño"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <InfoIcon size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardSubtitle}>
              Tu pulsera medirá automáticamente tus fases de descanso esta noche mientras duermes.
            </Text>
          </View>
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Meta clínica sugerida:</Text>
            <Text style={styles.metaValue}>7.5 horas</Text>
          </View>
          <Text style={styles.metaHint}>
            No requiere activación manual; se calcula con tu pulso en reposo y micromovimientos.
          </Text>
        </View>
      </View>

      {/* Info Tooltip Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconWrap}>
                <InfoIcon size={18} color="#0F766E" />
              </View>
              <Text style={styles.modalTitle}>Detección de Sueño</Text>
            </View>
            <Text style={styles.modalMessage}>
              El algoritmo de la pulsera analiza tus intervalos de reposo y variabilidad cardíaca para calcular tu recuperación nocturna. No necesitas presionar ningún botón antes de acostarte.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInfoModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  metaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  metaHint: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.text,
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  modalCloseButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
