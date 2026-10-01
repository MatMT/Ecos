import { Activity, HeartPulse, Waves } from "lucide-react"
import { StatCard } from "@/components/common/StatCard"
import type { BiometricRecordListItem } from "@/features/biometrics/types/biometric.types"
import {
  formatOverviewDateTime,
  formatOverviewNumber,
} from "@/features/patients/utils/patient-overview-formatters"

interface LatestBiometricMetricsProps {
  record: BiometricRecordListItem
  timeZone: string
}

export function LatestBiometricMetrics({
  record,
  timeZone,
}: LatestBiometricMetricsProps) {
  const recordDate = formatOverviewDateTime(record.timestamp, timeZone)

  return (
    <section aria-labelledby="latest-biometric-heading" className="space-y-3">
      <div>
        <h2
          className="text-lg font-semibold tracking-tight"
          id="latest-biometric-heading"
        >
          Último registro resumido
        </h2>
        <p className="text-sm text-muted-foreground">
          Fecha y hora del registro: {recordDate}.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          description="Promedio registrado en la ventana sincronizada."
          icon={HeartPulse}
          label="Frecuencia cardíaca"
          value={formatMetric(record.avgHeartRate, " bpm")}
        />
        <StatCard
          description="Índice numérico registrado en la ventana sincronizada."
          icon={Activity}
          label="Índice de estrés"
          value={formatMetric(record.stressLevel)}
        />
        <StatCard
          description="Promedio registrado en la ventana sincronizada."
          icon={Waves}
          label="Oxígeno en sangre"
          value={formatMetric(record.bloodOxygen, "%")}
        />
      </div>
    </section>
  )
}

export function formatMetric(value: number | null, suffix = ""): string {
  return value === null ? "Sin dato" : `${formatOverviewNumber(value)}${suffix}`
}
