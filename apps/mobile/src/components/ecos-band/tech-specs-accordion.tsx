import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '@/components/ui/app-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function TechSpecsAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setIsOpen((prev) => !prev)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Desplegar detalles técnicos y diagnóstico"
      >
        <View style={styles.accordionTitleRow}>
          <InfoIcon size={16} color={Colors.textSecondary} />
          <Text style={styles.accordionTitle}>
            Detalles técnicos y diagnóstico
          </Text>
        </View>
        {isOpen ? (
          <ChevronUpIcon size={16} color={Colors.textSecondary} />
        ) : (
          <ChevronDownIcon size={16} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.accordionContent}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Dispositivo:</Text>
            <Text style={styles.specValue}>
              Ecos Band (Sensor biométrico fisiológico)
            </Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Frecuencia de telemetría:</Text>
            <Text style={styles.specValue}>1000 ms (1 Hz)</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Protocolo de enlace:</Text>
            <Text style={styles.specValue}>
              BLE GATT con notificación activa en tiempo real
            </Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Trama de datos:</Text>
            <Text style={styles.specValue}>
              Estructura binaria empaquetada de 6 bytes (BPM, SpO2, Actividad, Flags)
            </Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Servicios GATT:</Text>
            <Text style={styles.specValue}>
              Heart Rate Service (UUID 0x180D) y Servicio de Telemetría Propietario
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  accordionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    backgroundColor: '#F8FAFC',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  accordionContent: {
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
    backgroundColor: Colors.surface,
  },
  specItem: {
    flexDirection: 'column',
    gap: 2,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  specValue: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
  },
});
