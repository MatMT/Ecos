/**
 * Design tokens for mobile. This is the single source of truth for colors and spacing —
 * screens must reference these instead of hardcoding hex values in their own StyleSheet.
 */

export const Colors = {
  brand: '#0F766E',
  brandDark: '#115E59',
  background: '#F2F9F8',
  surface: '#FFFFFF',
  border: '#D0EBE6',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  placeholder: '#94A3B8',
  inputBackground: '#F0FDF4',
  status: {
    normal: '#0F766E',
    elevated: '#6482AD',
    high: '#D97D64',
  },
  danger: '#DC2626',
  dangerSurface: '#FFF1F2',
  dangerBorder: '#FFE4E6',
} as const;

export type StatusColor = keyof typeof Colors.status;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 12,
  medium: 16,
  large: 20,
  pill: 50,
} as const;
