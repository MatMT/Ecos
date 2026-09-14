/**
 * Design tokens for patient-app. This is the single source of truth for colors and spacing —
 * screens must reference these instead of hardcoding hex values in their own StyleSheet.
 */

export const Colors = {
  brand: '#47ACA0',
  brandDark: '#29364C',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  placeholder: '#94A3B8',
  inputBackground: '#F0F0F3',
  status: {
    normal: '#059669',
    elevated: '#EFB644',
    high: '#DC2626',
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
