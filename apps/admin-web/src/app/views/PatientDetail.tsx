"use client"

import { useState, type CSSProperties, type FC } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  ArrowLeft,
  Heart,
  Droplets,
  Thermometer,
  Wind,
  Activity,
  Brain,
  Phone,
  Mail,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Wifi,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { patients } from "../data/mockData"

interface PatientDetailProps {
  patientId: string
}

const aiStatusConfig = {
  optimal: {
    label: "Estado Óptimo",
    variant: "success",
    panelClassName: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
    iconClassName: "bg-emerald-500",
    textClassName: "text-emerald-700 dark:text-emerald-300",
    icon: "OK",
  },
  moderate: {
    label: "Estado Moderado",
    variant: "info",
    panelClassName: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30",
    iconClassName: "bg-primary",
    textClassName: "text-blue-700 dark:text-blue-300",
    icon: "~",
  },
  elevated: {
    label: "Estrés Elevado",
    variant: "warning",
    panelClassName: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
    iconClassName: "bg-amber-500",
    textClassName: "text-amber-700 dark:text-amber-300",
    icon: "!",
  },
  critical: {
    label: "Estado Crítico",
    variant: "destructive",
    panelClassName: "border-destructive/30 bg-destructive/10",
    iconClassName: "bg-destructive",
    textClassName: "text-destructive",
    icon: "!",
  },
} as const

type MetricTone = "danger" | "info" | "success" | "warning" | "violet"

const metricToneConfig: Record<
  MetricTone,
  { iconClassName: string; trendClassName: string }
> = {
  danger: {
    iconClassName: "bg-destructive/10 text-destructive",
    trendClassName: "text-destructive",
  },
  info: {
    iconClassName: "bg-blue-50 text-primary dark:bg-blue-950/40",
    trendClassName: "text-primary",
  },
  success: {
    iconClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    trendClassName: "text-emerald-600 dark:text-emerald-300",
  },
  warning: {
    iconClassName: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
    trendClassName: "text-amber-600 dark:text-amber-300",
  },
  violet: {
    iconClassName: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
    trendClassName: "text-violet-600 dark:text-violet-300",
  },
}

const MetricCard: FC<{
  label: string
  value: string | number
  unit: string
  icon: FC<{ size?: number; className?: string; style?: CSSProperties }>
  tone: MetricTone
  trend?: "up" | "down" | "stable"
  trendGood?: boolean
  sub?: string
}> = ({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  trend,
  trendGood,
  sub,
}) => {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendClassName =
    trend === "stable"
      ? "text-muted-foreground"
      : trendGood === (trend === "up")
        ? "text-emerald-600 dark:text-emerald-300"
        : metricToneConfig.danger.trendClassName

  return (
    <Card className="gap-0 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${metricToneConfig[tone].iconClassName}`}>
          <Icon size={17} />
        </div>
        {trend && <TrendIcon size={14} className={trendClassName} />}
      </div>
      <p className="mono text-2xl font-bold leading-none text-foreground">
        {value}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  )
}

const PatientDetail: FC<PatientDetailProps> = ({ patientId }) => {
  const router = useRouter()
  const patient = patients.find((p) => p.id === patientId)
  const [activeChart, setActiveChart] =
    useState<"heartRate" | "bp" | "spo2" | "stress">("heartRate")
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  if (!patient) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/patients")}
          className="mb-5 -ml-2 text-muted-foreground"
        >
          <ArrowLeft size={16} />
          Volver a pacientes
        </Button>
        <Card className="gap-0 p-6 shadow-sm">
          <h1 className="text-lg font-bold text-foreground">
            Paciente no encontrado
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifica el identificador del paciente e intenta nuevamente.
          </p>
        </Card>
      </div>
    )
  }

  const aiStatus = aiStatusConfig[patient.aiStatus]
  const chartData = {
    heartRate: patient.weeklyData.map((d) => ({
      name: d.day,
      value: d.heartRate,
      ref: 75,
    })),
    bp: patient.weeklyData.map((d) => ({
      name: d.day,
      sistolica: d.systolic,
      diastolica: d.diastolic,
    })),
    spo2: patient.weeklyData.map((d) => ({
      name: d.day,
      value: d.spo2,
      ref: 95,
    })),
    stress: patient.weeklyData.map((d) => ({
      name: d.day,
      value: d.stressIndex,
      ref: 50,
    })),
  }
  const chartTabs = [
    { key: "heartRate" as const, label: "Frec. Cardíaca", color: "var(--chart-4)" },
    { key: "bp" as const, label: "Presión Arterial", color: "var(--chart-1)" },
    { key: "spo2" as const, label: "SpO2", color: "var(--chart-2)" },
    { key: "stress" as const, label: "Índice de Estrés", color: "var(--chart-3)" },
  ]
  const activeTab = chartTabs.find((t) => t.key === activeChart)!

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/patients")}
          className="mb-5 -ml-2 text-muted-foreground"
        >
          <ArrowLeft size={16} />
          Volver a pacientes
        </Button>

        <Card className="flex-row flex-wrap items-start gap-5 p-6 shadow-sm">
          <div className="relative">
            <img
              src={patient.photo}
              alt={patient.name}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <span
              className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card ${aiStatus.iconClassName}`}
            >
              <Wifi size={10} className="text-white" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {patient.name}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {patient.diagnosis}
                </p>
              </div>
              <Badge variant={aiStatus.variant} className="h-6 px-3 font-semibold">
                {aiStatus.icon} {aiStatus.label}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span>{patient.age} años</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText size={12} />
                <span>{patient.sessions} sesiones</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone size={12} />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail size={12} />
                <span>{patient.email}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/clinical-notes?patientId=${patient.id}`)
              }
              className="h-10 px-4"
            >
              Agregar nota
            </Button>
            <Button size="lg" className="h-10 px-4">
              Iniciar sesión
            </Button>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Frecuencia Cardíaca"
          value={patient.currentMetrics.heartRate}
          unit="bpm"
          icon={Heart}
          tone="danger"
          trend={patient.currentMetrics.heartRate > 80 ? "up" : "stable"}
          trendGood={false}
          sub="Última lectura"
        />
        <MetricCard
          label="Presión Arterial"
          value={`${patient.currentMetrics.systolic}/${patient.currentMetrics.diastolic}`}
          unit="mmHg"
          icon={Activity}
          tone="info"
          trend={patient.currentMetrics.systolic > 130 ? "up" : "stable"}
          trendGood={false}
          sub="Sistólica / Diastólica"
        />
        <MetricCard
          label="Saturación de Oxígeno"
          value={patient.currentMetrics.spo2}
          unit="%"
          icon={Droplets}
          tone="success"
          trend={patient.currentMetrics.spo2 < 96 ? "down" : "stable"}
          trendGood={false}
          sub="SpO2"
        />
        <MetricCard
          label="Temperatura"
          value={patient.currentMetrics.temperature}
          unit="°C"
          icon={Thermometer}
          tone="warning"
          trend="stable"
          sub="Corporal"
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Índice de Estrés"
          value={patient.currentMetrics.stressIndex}
          unit="/100"
          icon={Brain}
          tone={
            patient.currentMetrics.stressIndex > 75
              ? "danger"
              : patient.currentMetrics.stressIndex > 55
                ? "warning"
                : "success"
          }
          trend={patient.currentMetrics.stressIndex > 60 ? "up" : "stable"}
          trendGood={false}
        />
        <MetricCard
          label="Frec. Respiratoria"
          value={patient.currentMetrics.respiratoryRate}
          unit="rpm"
          icon={Wind}
          tone="violet"
          trend="stable"
          sub="Respiraciones por min."
        />
        <Card className="col-span-2 gap-0 p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Índice de estrés acumulado
          </p>
          <div className="flex items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  patient.currentMetrics.stressIndex > 75
                    ? "bg-destructive"
                    : patient.currentMetrics.stressIndex > 55
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{
                  width: `${patient.currentMetrics.stressIndex}%`,
                }}
              />
            </div>
            <span className="mono text-lg font-bold text-foreground">
              {patient.currentMetrics.stressIndex}%
            </span>
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Bajo</span>
            <span>Moderado</span>
            <span>Alto</span>
            <span>Crítico</span>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="gap-0 p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">
              Historial biomédico semanal
            </h2>
          </div>
          <Tabs
            value={activeChart}
            onValueChange={(value) =>
              setActiveChart(value as "heartRate" | "bp" | "spo2" | "stress")
            }
            className="mb-5"
          >
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {chartTabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="h-8 flex-none rounded-lg border border-border bg-card px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
            </TabsList>
          </Tabs>

          <ResponsiveContainer width="100%" height={220}>
            {activeChart === "bp" ? (
              <LineChart data={chartData.bp}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[60, 160]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sistolica"
                  name="Sistólica"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--chart-1)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolica"
                  name="Diastólica"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={{ fill: "var(--primary)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <ReferenceLine
                  y={130}
                  stroke="var(--chart-4)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData[activeChart]}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={activeTab.color}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor={activeTab.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                {(chartData[activeChart] as Array<{ ref?: number }>)[0]?.ref !==
                  undefined && (
                  <ReferenceLine
                    y={
                      (chartData[activeChart] as Array<{ ref?: number }>)[0].ref
                    }
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 3"
                    strokeOpacity={0.5}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeTab.color}
                  strokeWidth={2.5}
                  fill="url(#chartGrad)"
                  dot={{ fill: activeTab.color, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </Card>

        <div className={`flex flex-col rounded-xl border p-5 shadow-sm ${aiStatus.panelClassName}`}>
          <div className="mb-4 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white ${aiStatus.iconClassName}`}>
              IA
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">
                Interpretación IA
              </p>
              <p className={`text-xs ${aiStatus.textClassName}`}>
                {aiStatus.label}
              </p>
            </div>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-foreground">
            {patient.aiInsight}
          </p>
          <div className="mt-4 border-t border-current/10 pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Análisis generado:
            </p>
            <p className="mono text-xs text-muted-foreground">
              {new Date(patient.currentMetrics.timestamp).toLocaleString(
                "es-CO",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                },
              )}
            </p>
          </div>
          <Button className="mt-3 w-full" size="sm">
            Ver análisis completo
          </Button>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-base font-bold text-foreground">
            Historial de sesiones
          </h2>
          <Button
            onClick={() =>
              router.push(`/clinical-notes?patientId=${patient.id}`)
            }
            size="sm"
          >
            + Nueva sesión
          </Button>
        </div>
        <div className="divide-y divide-border">
          {patient.sessions_history.map((session) => (
            <div key={session.id} className="px-6">
              <button
                className="flex w-full items-center gap-4 rounded-lg py-4 text-left transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() =>
                  setExpandedSession(
                    expandedSession === session.id ? null : session.id,
                  )
                }
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
                  <FileText size={14} className="text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {session.type}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {session.date} - {session.duration} min -{" "}
                    {session.emotionalState}
                  </p>
                </div>
                {expandedSession === session.id ? (
                  <ChevronUp
                    size={16}
                    className="flex-shrink-0 text-muted-foreground"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className="flex-shrink-0 text-muted-foreground"
                  />
                )}
              </button>
              {expandedSession === session.id && (
                <div className="space-y-3 pb-5">
                  <div className="rounded-xl bg-muted p-4">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Notas de sesión
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {session.notes}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-accent p-4">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Diagnóstico
                      </p>
                      <p className="text-sm text-foreground">
                        {session.diagnosis}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted p-4">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600">
                        Observaciones
                      </p>
                      <p className="text-sm text-foreground">
                        {session.observations}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default PatientDetail
