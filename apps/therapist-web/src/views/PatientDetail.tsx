'use client'

import { useState, type CSSProperties, type FC } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'recharts'
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
} from 'lucide-react'
import { patients } from '../data/mockData'

interface PatientDetailProps {
  patientId: string
}

const aiStatusConfig = {
  optimal: { label: 'Estado Óptimo', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: 'OK' },
  moderate: { label: 'Estado Moderado', color: '#1a7dbf', bg: '#eff6ff', border: '#bfdbfe', icon: '~' },
  elevated: { label: 'Estrés Elevado', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '!' },
  critical: { label: 'Estado Crítico', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '!' },
}

const MetricCard: FC<{
  label: string
  value: string | number
  unit: string
  icon: FC<{ size?: number; className?: string; style?: CSSProperties }>
  iconColor: string
  iconBg: string
  trend?: 'up' | 'down' | 'stable'
  trendGood?: boolean
  sub?: string
}> = ({ label, value, unit, icon: Icon, iconColor, iconBg, trend, trendGood, sub }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'stable' ? '#94a3b8' : trendGood === (trend === 'up') ? '#10b981' : '#ef4444'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: iconBg }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        {trend && <TrendIcon size={14} style={{ color: trendColor }} />}
      </div>
      <p className="mono text-2xl font-bold leading-none text-slate-800">
        {value}
        <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

const PatientDetail: FC<PatientDetailProps> = ({ patientId }) => {
  const router = useRouter()
  const patient = patients.find((p) => p.id === patientId)
  const [activeChart, setActiveChart] = useState<'heartRate' | 'bp' | 'spo2' | 'stress'>('heartRate')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  if (!patient) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/patients')}
          className="mb-5 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          Volver a pacientes
        </button>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">Paciente no encontrado</h1>
          <p className="mt-1 text-sm text-slate-500">
            Verifica el identificador del paciente e intenta nuevamente.
          </p>
        </div>
      </div>
    )
  }

  const aiStatus = aiStatusConfig[patient.aiStatus]
  const chartData = {
    heartRate: patient.weeklyData.map((d) => ({ name: d.day, value: d.heartRate, ref: 75 })),
    bp: patient.weeklyData.map((d) => ({
      name: d.day,
      sistolica: d.systolic,
      diastolica: d.diastolic,
    })),
    spo2: patient.weeklyData.map((d) => ({ name: d.day, value: d.spo2, ref: 95 })),
    stress: patient.weeklyData.map((d) => ({ name: d.day, value: d.stressIndex, ref: 50 })),
  }
  const chartTabs = [
    { key: 'heartRate' as const, label: 'Frec. Cardíaca', color: '#ef4444' },
    { key: 'bp' as const, label: 'Presión Arterial', color: '#1a7dbf' },
    { key: 'spo2' as const, label: 'SpO2', color: '#10b981' },
    { key: 'stress' as const, label: 'Índice de Estrés', color: '#f59e0b' },
  ]
  const activeTab = chartTabs.find((t) => t.key === activeChart)!

  return (
    <div className="max-w-7xl p-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/patients')}
          className="mb-5 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          Volver a pacientes
        </button>

        <div className="flex flex-wrap items-start gap-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="relative">
            <img src={patient.photo} alt={patient.name} className="h-20 w-20 rounded-2xl object-cover" />
            <span
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white"
              style={{ background: aiStatus.color }}
            >
              <Wifi size={10} className="text-white" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1
                  className="text-2xl font-bold text-slate-800"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {patient.name}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">{patient.diagnosis}</p>
              </div>
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ color: aiStatus.color, background: aiStatus.bg, borderColor: aiStatus.border }}
              >
                {aiStatus.icon} {aiStatus.label}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar size={12} />
                <span>{patient.age} años</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <FileText size={12} />
                <span>{patient.sessions} sesiones</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Phone size={12} />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mail size={12} />
                <span>{patient.email}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={() => router.push(`/clinical-notes?patientId=${patient.id}`)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
            >
              Agregar nota
            </button>
            <button
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1a7dbf, #2d96dc)' }}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Frecuencia Cardíaca" value={patient.currentMetrics.heartRate} unit="bpm" icon={Heart} iconColor="#ef4444" iconBg="#fef2f2" trend={patient.currentMetrics.heartRate > 80 ? 'up' : 'stable'} trendGood={false} sub="Última lectura" />
        <MetricCard label="Presión Arterial" value={`${patient.currentMetrics.systolic}/${patient.currentMetrics.diastolic}`} unit="mmHg" icon={Activity} iconColor="#1a7dbf" iconBg="#eff6ff" trend={patient.currentMetrics.systolic > 130 ? 'up' : 'stable'} trendGood={false} sub="Sistólica / Diastólica" />
        <MetricCard label="Saturación de Oxígeno" value={patient.currentMetrics.spo2} unit="%" icon={Droplets} iconColor="#10b981" iconBg="#ecfdf5" trend={patient.currentMetrics.spo2 < 96 ? 'down' : 'stable'} trendGood={false} sub="SpO2" />
        <MetricCard label="Temperatura" value={patient.currentMetrics.temperature} unit="°C" icon={Thermometer} iconColor="#f59e0b" iconBg="#fffbeb" trend="stable" sub="Corporal" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Índice de Estrés"
          value={patient.currentMetrics.stressIndex}
          unit="/100"
          icon={Brain}
          iconColor={patient.currentMetrics.stressIndex > 75 ? '#ef4444' : patient.currentMetrics.stressIndex > 55 ? '#f59e0b' : '#10b981'}
          iconBg={patient.currentMetrics.stressIndex > 75 ? '#fef2f2' : patient.currentMetrics.stressIndex > 55 ? '#fffbeb' : '#ecfdf5'}
          trend={patient.currentMetrics.stressIndex > 60 ? 'up' : 'stable'}
          trendGood={false}
        />
        <MetricCard label="Frec. Respiratoria" value={patient.currentMetrics.respiratoryRate} unit="rpm" icon={Wind} iconColor="#8b5cf6" iconBg="#f5f3ff" trend="stable" sub="Respiraciones por min." />
        <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Índice de estrés acumulado
          </p>
          <div className="flex items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${patient.currentMetrics.stressIndex}%`,
                  background:
                    patient.currentMetrics.stressIndex > 75
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : patient.currentMetrics.stressIndex > 55
                        ? 'linear-gradient(90deg, #10b981, #f59e0b)'
                        : 'linear-gradient(90deg, #1a7dbf, #10b981)',
                }}
              />
            </div>
            <span className="mono text-lg font-bold text-slate-800">
              {patient.currentMetrics.stressIndex}%
            </span>
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-slate-400">
            <span>Bajo</span>
            <span>Moderado</span>
            <span>Alto</span>
            <span>Crítico</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-base font-bold text-slate-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Historial biomédico semanal
            </h2>
          </div>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {chartTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={
                  activeChart === tab.key
                    ? { background: tab.color, color: '#fff' }
                    : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            {activeChart === 'bp' ? (
              <LineChart data={chartData.bp}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 160]} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="sistolica" name="Sistólica" stroke="#1a7dbf" strokeWidth={2.5} dot={{ fill: '#1a7dbf', r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="diastolica" name="Diastólica" stroke="#2d96dc" strokeWidth={2.5} strokeDasharray="5 3" dot={{ fill: '#2d96dc', r: 3 }} activeDot={{ r: 5 }} />
                <ReferenceLine y={130} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
              </LineChart>
            ) : (
              <AreaChart data={chartData[activeChart]}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeTab.color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={activeTab.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
                {(chartData[activeChart] as Array<{ ref?: number }>)[0]?.ref !== undefined && (
                  <ReferenceLine y={(chartData[activeChart] as Array<{ ref?: number }>)[0].ref} stroke="#94a3b8" strokeDasharray="4 3" strokeOpacity={0.5} />
                )}
                <Area type="monotone" dataKey="value" stroke={activeTab.color} strokeWidth={2.5} fill="url(#chartGrad)" dot={{ fill: activeTab.color, r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        <div
          className="flex flex-col rounded-2xl border p-5 shadow-sm"
          style={{ background: aiStatus.bg, borderColor: aiStatus.border }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{ background: aiStatus.color }}
            >
              IA
            </div>
            <div>
              <p
                className="text-sm font-bold text-slate-800"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Interpretación IA
              </p>
              <p className="text-xs" style={{ color: aiStatus.color }}>
                {aiStatus.label}
              </p>
            </div>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-slate-700">{patient.aiInsight}</p>
          <div className="mt-4 border-t border-black/5 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Análisis generado:</p>
            <p className="mono text-xs text-slate-400">
              {new Date(patient.currentMetrics.timestamp).toLocaleString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'short',
              })}
            </p>
          </div>
          <button
            className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: aiStatus.color }}
          >
            Ver análisis completo
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-50 px-6 py-5">
          <h2
            className="text-base font-bold text-slate-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Historial de sesiones
          </h2>
          <button
            onClick={() => router.push(`/clinical-notes?patientId=${patient.id}`)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#1a7dbf' }}
          >
            + Nueva sesión
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {patient.sessions_history.map((session) => (
            <div key={session.id} className="px-6">
              <button
                className="flex w-full items-center gap-4 py-4 text-left"
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <FileText size={14} className="text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{session.type}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {session.date} - {session.duration} min - {session.emotionalState}
                  </p>
                </div>
                {expandedSession === session.id ? (
                  <ChevronUp size={16} className="flex-shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="flex-shrink-0 text-slate-400" />
                )}
              </button>
              {expandedSession === session.id && (
                <div className="space-y-3 pb-5">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notas de sesión
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700">{session.notes}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Diagnóstico
                      </p>
                      <p className="text-sm text-slate-700">{session.diagnosis}</p>
                    </div>
                    <div className="rounded-xl bg-purple-50 p-4">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600">
                        Observaciones
                      </p>
                      <p className="text-sm text-slate-700">{session.observations}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatientDetail
