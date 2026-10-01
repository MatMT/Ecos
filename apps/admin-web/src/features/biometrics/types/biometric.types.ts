export interface BiometricRecordListItem {
  avgHeartRate: number | null
  bloodOxygen: number | null
  createdAt: string
  id: number
  stressLevel: number | null
  timestamp: string | null
}

export interface PatientBiometricsMeta {
  institutionTimezone: string
  skip: number
  take: number
  total: number
  totalPages: number
}

export interface PatientBiometricsResponse {
  data: BiometricRecordListItem[]
  latest: BiometricRecordListItem | null
  meta: PatientBiometricsMeta
}

export const BIOMETRIC_RANGE_OPTIONS = ["24h", "7d", "30d", "90d"] as const

export type BiometricRange = (typeof BIOMETRIC_RANGE_OPTIONS)[number]

export type BiometricRangeBucket = "day" | "hour"

export interface PatientBiometricsParams {
  range: BiometricRange
  skip: number
  take: number
}

export interface BiometricMetricSummary {
  average: number | null
  count: number
  maximum: number | null
  minimum: number | null
}

export interface PatientBiometricSummary {
  metrics: {
    avgHeartRate: BiometricMetricSummary
    bloodOxygen: BiometricMetricSummary
    stressLevel: BiometricMetricSummary
  }
  range: {
    bucket: BiometricRangeBucket
    from: string
    institutionTimezone: string
    key: BiometricRange
    to: string
  }
  sampleCount: number
  series: BiometricSummarySeriesPoint[]
}

export interface BiometricSummarySeriesPoint {
  avgHeartRate: number | null
  bloodOxygen: number | null
  sampleCount: number
  stressLevel: number | null
  timestamp: string
}

export const DEFAULT_BIOMETRICS_PAGE = 1
export const DEFAULT_BIOMETRICS_TAKE = 20
export const DEFAULT_BIOMETRIC_RANGE: BiometricRange = "7d"
export const BIOMETRICS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
