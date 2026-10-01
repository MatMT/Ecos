import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, type StatusColor } from '@/constants/theme';

const STATUS_LABEL: Record<StatusColor, string> = {
  normal: 'Normal',
  elevated: 'Elevado',
  high: 'Alto',
};

export interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  status?: StatusColor;
}

export function MetricCard({ label, value, unit, status }: MetricCardProps) {
  const statusColor = status ? Colors.status[status] : undefined;

  return (
    <View style={[styles.card, statusColor && { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
      {status && <Text style={[styles.statusLabel, { color: statusColor }]}>{STATUS_LABEL[status]}</Text>}
      <Text style={styles.value}>
        {value}
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    width: '48%',
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
    elevation: 2,
  },
  statusLabel: {
    alignSelf: 'flex-end',
    fontSize: 14,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  unit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
