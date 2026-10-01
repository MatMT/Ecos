export const BIOMETRIC_RANGE_KEYS = ['24h', '7d', '30d', '90d'] as const;

export type BiometricRangeKey = (typeof BIOMETRIC_RANGE_KEYS)[number];
