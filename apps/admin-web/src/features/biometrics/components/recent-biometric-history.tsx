import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import type { BiometricRecordListItem } from "@/features/biometrics/types/biometric.types"
import {
  formatOverviewDateTime,
} from "@/features/patients/utils/patient-overview-formatters"
import { formatMetric } from "@/features/biometrics/components/latest-biometric-metrics"

interface RecentBiometricHistoryProps {
  records: readonly BiometricRecordListItem[]
  timeZone: string
}

export function RecentBiometricHistory({
  records,
  timeZone,
}: RecentBiometricHistoryProps) {
  const columns: readonly DataTableColumn<BiometricRecordListItem>[] = [
    {
      cell: (record) => formatOverviewDateTime(record.timestamp, timeZone),
      header: "Fecha y hora",
      id: "timestamp",
    },
    {
      align: "right",
      cell: (record) => formatMetric(record.avgHeartRate, " bpm"),
      header: "Frecuencia cardíaca",
      id: "heart-rate",
    },
    {
      align: "right",
      cell: (record) => formatMetric(record.stressLevel),
      header: "Índice de estrés",
      id: "stress-level",
    },
    {
      align: "right",
      cell: (record) => formatMetric(record.bloodOxygen, "%"),
      header: "Oxígeno en sangre",
      id: "blood-oxygen",
    },
  ]

  return (
    <section aria-labelledby="recent-biometric-history-heading" className="space-y-3">
      <div>
        <h2
          className="text-lg font-semibold tracking-tight"
          id="recent-biometric-history-heading"
        >
          Registros recientes
        </h2>
        <p className="text-sm text-muted-foreground">
          Historial de datos biométricos sincronizados para el período seleccionado.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={records}
        getRowId={(record) => record.id}
      />
    </section>
  )
}
