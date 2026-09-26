import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { useServerHealth } from '@/hooks/use-server-health';

export function DevServerBanner() {
  const { status, isChecking, check } = useServerHealth(__DEV__);

  if (!__DEV__ || !status || status.isHealthy) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diagnóstico de conexión (Desarrollo)</Text>
      <Text style={styles.description}>
        No es posible conectar con el servidor backend en la dirección configurada:
      </Text>
      <View style={styles.urlBadge}>
        <Text style={styles.urlText}>{status.url}</Text>
      </View>
      {status.errorMessage ? (
        <Text style={styles.errorDetail}>{status.errorMessage}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.retryButton, isChecking && styles.retryButtonDisabled]}
        onPress={() => void check()}
        disabled={isChecking}
        accessibilityRole="button"
        accessibilityLabel="Reintentar verificación del servidor">
        {isChecking ? (
          <ActivityIndicator size="small" color={Colors.surface} />
        ) : (
          <Text style={styles.retryText}>Reintentar conexión</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#92400E',
  },
  description: {
    fontSize: 11,
    color: '#78350F',
    textAlign: 'center',
  },
  urlBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urlText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#92400E',
  },
  errorDetail: {
    fontSize: 11,
    color: '#B45309',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
});
