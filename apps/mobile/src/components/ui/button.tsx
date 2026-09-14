import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type ViewStyle } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

type ButtonVariant = 'primary' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}>
      {loading ? (
        <ActivityIndicator color={Colors.surface} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: Colors.surface,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.brandDark,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
});
