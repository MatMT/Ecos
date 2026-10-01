"use client"

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMetric } from "@/features/biometrics/components/latest-biometric-metrics"
import { usePatientBiometricSummary } from "@/features/biometrics/hooks/use-patient-biometric-summary"
import type {
  BiometricMetricSummary,
  BiometricRange,
  BiometricSummarySeriesPoint,
  PatientBiometricSummary,
} from "@/features/biometrics/types/biometric.types"
import {
  formatOverviewDate,
  formatOverviewDateTime,
} from "@/features/patients/utils/patient-overview-formatters"
import { ApiError } from "@/lib/api"

const rangeLabels: Readonly<Record<BiometricRange, string>> = {
  "24h": "Últimas 24 horas",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
}

interface BiometricTrendsProps {
  onRangeChange: (range: BiometricRange) => void
  patientId: number
  range: BiometricRange
}

interface MetricTrendDefinition {
  color: string
  description: string
  key: keyof PatientBiometricSummary["metrics"]
  label: string
  seriesKey: keyof Pick<
    BiometricSummarySeriesPoint,
    "avgHeartRate" | "bloodOxygen" | "stressLevel"
  >
  suffix?: string
}

const metricDefinitions: readonly MetricTrendDefinition[] = [
  {
    color: "var(--chart-1)",
    description: "Promedios por intervalo de registros sincronizados.",
    key: "avgHeartRate",
    label: "Frecuencia cardíaca",
    seriesKey: "avgHeartRate",
    suffix: " bpm",
  },
  {
    color: "var(--chart-2)",
    description: "Promedios del índice numérico almacenado.",
    key: "stressLevel",
    label: "Índice de estrés",
    seriesKey: "stressLevel",
  },
  {
    color: "var(--chart-3)",
    description: "Promedios por intervalo de registros sincronizados.",
    key: "bloodOxygen",
    label: "Oxígeno en sangre",
    seriesKey: "bloodOxygen",
    suffix: "%",
  },
]

export function BiometricTrends({
  onRangeChange,
  patientId,
  range,
}: BiometricTrendsProps) {
  const summaryQuery = usePatientBiometricSummary(patientId, range)

  if (summaryQuery.isPending) {
    return <BiometricTrendsSkeleton />
  }

  if (summaryQuery.isError) {
    if (summaryQuery.error instanceof ApiError && summaryQuery.error.status === 403) {
      return <ForbiddenState variant="embedded" />
    }

    return (
      <section aria-labelledby="biometric-trends-heading">
        <TrendsHeader onRangeChange={onRangeChange} range={range} />
        <ErrorState
          description="No fue posible calcular las tendencias biométricas. Por favor, intente nuevamente."
          onRetry={() => void summaryQuery.refetch()}
          title="No fue posible cargar las tendencias"
        />
      </section>
    )
  }

  const summary = summaryQuery.data
  if (!summary) {
    return null
  }

  return (
    <section aria-labelledby="biometric-trends-heading" className="space-y-4">
      <TrendsHeader onRangeChange={onRangeChange} range={range} />
      {summaryQuery.isFetching ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Actualizando tendencias…
        </p>
      ) : null}
      {summary.sampleCount === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No hay datos biométricos sincronizados en el período seleccionado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {metricDefinitions.map((definition) => (
            <MetricTrendPanel
              definition={definition}
              key={definition.key}
              range={summary.range}
              series={summary.series}
              summary={summary.metrics[definition.key]}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function TrendsHeader({ onRangeChange, range }: Omit<BiometricTrendsProps, "patientId">) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight" id="biometric-trends-heading">
          Tendencias descriptivas
        </h2>
        <p className="text-sm text-muted-foreground">
          Resumen de datos biométricos sincronizados para el período seleccionado.
        </p>
      </div>
      <div className="grid gap-2 sm:w-56">
        <Label htmlFor="biometric-range">Período</Label>
        <Select value={range} onValueChange={(value) => onRangeChange(value as BiometricRange)}>
          <SelectTrigger className="w-full" id="biometric-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(rangeLabels) as [BiometricRange, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface MetricTrendPanelProps {
  definition: MetricTrendDefinition
  range: PatientBiometricSummary["range"]
  series: PatientBiometricSummary["series"]
  summary: BiometricMetricSummary
}

function MetricTrendPanel({
  definition,
  range,
  series,
  summary,
}: MetricTrendPanelProps) {
  const metricId = `biometric-${definition.key}-trend`

  return (
    <Card>
      <CardHeader>
        <CardTitle id={metricId}>{definition.label}</CardTitle>
        <CardDescription>{definition.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {summary.count === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin datos registrados para esta métrica en el período seleccionado.
          </p>
        ) : (
          <>
            <MetricSummary definition={definition} summary={summary} />
            <p className="sr-only">
              {buildAccessibleSummary(definition, summary, range.key)}
            </p>
            <div aria-labelledby={metricId} className="h-60 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={series} margin={{ bottom: 4, left: 0, right: 16, top: 8 }}>
                  <XAxis
                    dataKey="timestamp"
                    minTickGap={24}
                    tickFormatter={(value) => formatBucket(value, range)}
                  />
                  <YAxis width={36} />
                  <Tooltip
                    content={
                      <BiometricTrendTooltip
                        range={range}
                        seriesKey={definition.seriesKey}
                        suffix={definition.suffix}
                      />
                    }
                  />
                  <Line
                    connectNulls={false}
                    dataKey={definition.seriesKey}
                    dot={false}
                    isAnimationActive={false}
                    name={definition.label}
                    stroke={definition.color}
                    strokeWidth={2}
                    type="linear"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function MetricSummary({
  definition,
  summary,
}: Pick<MetricTrendPanelProps, "definition" | "summary">) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <MetricSummaryItem label="Promedio" value={formatMetric(summary.average, definition.suffix)} />
      <MetricSummaryItem label="Mínimo" value={formatMetric(summary.minimum, definition.suffix)} />
      <MetricSummaryItem label="Máximo" value={formatMetric(summary.maximum, definition.suffix)} />
      <MetricSummaryItem label="Registros válidos" value={String(summary.count)} />
    </dl>
  )
}

function MetricSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function BiometricTrendTooltip({
  active,
  payload,
  range,
  seriesKey,
  suffix,
}: {
  active?: boolean
  payload?: readonly { payload?: BiometricSummarySeriesPoint }[]
  range: PatientBiometricSummary["range"]
  seriesKey: MetricTrendDefinition["seriesKey"]
  suffix?: string
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) {
    return null
  }

  const value = point[seriesKey]
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
      <p className="font-medium">{formatBucketTooltip(point.timestamp, range)}</p>
      <p>{formatMetric(value, suffix)}</p>
      <p className="text-muted-foreground">Muestras: {point.sampleCount}</p>
    </div>
  )
}

function formatBucket(value: string, range: PatientBiometricSummary["range"]): string {
  return range.bucket === "hour"
    ? formatOverviewDateTime(value, range.institutionTimezone)
    : formatOverviewDate(value, range.institutionTimezone)
}

function formatBucketTooltip(
  value: string,
  range: PatientBiometricSummary["range"],
): string {
  return formatBucket(value, range)
}

function buildAccessibleSummary(
  definition: MetricTrendDefinition,
  summary: BiometricMetricSummary,
  range: BiometricRange,
): string {
  return `${definition.label} durante ${rangeLabels[range]}: promedio ${formatMetric(summary.average, definition.suffix)}, mínimo ${formatMetric(summary.minimum, definition.suffix)}, máximo ${formatMetric(summary.maximum, definition.suffix)} y ${summary.count} registros válidos.`
}

function BiometricTrendsSkeleton() {
  return (
    <section aria-hidden="true" className="space-y-4">
      <Skeleton className="h-16 w-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-80 w-full" key={index} />
      ))}
    </section>
  )
}
