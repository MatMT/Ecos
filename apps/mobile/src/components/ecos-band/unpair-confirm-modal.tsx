import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { WatchIcon } from '@/components/ui/app-icons';
import { Radius } from '@/constants/theme';

export interface UnpairConfirmModalProps {
  visible: boolean;
  isUnpairing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnpairConfirmModal({
  visible,
  isUnpairing,
  onConfirm,
  onCancel,
}: UnpairConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isUnpairing) onCancel();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <WatchIcon size={26} color="#DC2626" strokeWidth={2} />
          </View>

          <Text style={styles.title}>¿Desvincular Ecos Band?</Text>
          <Text style={styles.subtitle}>
            Se interrumpirá la sincronización del dispositivo
          </Text>

          <Text style={styles.body}>
            El dispositivo dejará de sincronizarse con este teléfono y se eliminará el enlace seguro almacenado. Podrá volver a vincular la pulsera en cualquier momento desde esta pantalla.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onConfirm}
              disabled={isUnpairing}
              activeOpacity={0.8}
            >
              {isUnpairing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Desvincular pulsera</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isUnpairing}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
    borderRadius: Radius.medium,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
