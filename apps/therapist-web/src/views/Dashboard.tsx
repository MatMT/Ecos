'use client'

import type { CSSProperties, FC } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  Wifi,
  Heart,
  Droplets,
  Thermometer,
} from 'lucide-react'
import { patients, dashboardStats, weeklySessionData } from '../data/mockData'

const statusConfig = {
  critical: { label: 'Crítico', color: '#ef4444', bg: '#fef2f2', dot: '#ef4444' },
  attention: { label: 'Atención', color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b' },
  stable: { label: 'Estable', color: '#1a7dbf', bg: '#eff6ff', dot: '#1a7dbf' },
  good: { label: 'Óptimo', color: '#10b981', bg: '#ecfdf5', dot: '#10b981' },
}

const StatCard: FC<{
  label: string
  value: number | string
  sub: string
  icon: FC<{ size?: number; className?: string; style?: CSSProperties }>
  color: string
  bg: string
}> = ({ label, value, sub, icon: Icon, color, bg }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
      style={{ background: bg }}
    >
      <Icon size={22} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="mb-0.5 text-xs font-medium text-slate-500">{label}</p>
      <p
        className="mb-1 text-2xl font-bold leading-none text-slate-800"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  </div>
)

const Dashboard: FC = () => {
  const router = useRouter()
  const criticalPatients = patients.filter((p) => p.status === 'critical')
  const attentionPatients = patients.filter((p) => p.status === 'attention')
  const topActivity = [...patients]
    .sort((a, b) => b.currentMetrics.stressIndex - a.currentMetrics.stressIndex)
    .slice(0, 3)

  const handleSelectPatient = (id: string) => {
    router.push(`/patients/${id}`)
  }

  return (
    <div className="max-w-7xl space-y-7 p-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm text-slate-400">Martes, 22 de julio de 2026</p>
          <h1
            className="text-2xl font-bold text-slate-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Bienvenido, Dr. Mendez
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Tienes {criticalPatients.length + attentionPatients.length} pacientes que
            requieren seguimiento hoy.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2 shadow-sm">
          <Wifi size={14} className="text-emerald-500" />
          <span className="text-xs font-medium text-slate-600">Pulseras activas: 5</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total pacientes"
          value={dashboardStats.totalPatients}
          sub="En seguimiento activo"
          icon={Users}
          color="#1a7dbf"
          bg="#eff6ff"
        />
        <StatCard
          label="Consultas activas"
          value={dashboardStats.activeConsultations}
          sub="Esta semana"
          icon={Activity}
          color="#10b981"
          bg="#ecfdf5"
        />
        <StatCard
          label="Requieren atención"
          value={dashboardStats.needsAttention}
          sub="Métricas elevadas"
          icon={AlertTriangle}
          color="#f59e0b"
          bg="#fffbeb"
        />
        <StatCard
          label="En estado crítico"
          value={criticalPatients.length}
          sub="Intervención urgente"
          icon={TrendingUp}
          color="#ef4444"
          bg="#fef2f2"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2
                className="text-base font-bold text-slate-800"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Actividad semanal de sesiones
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Distribución por estado clínico
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklySessionData} barSize={12} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="stable" name="Estable" fill="#1a7dbf" radius={[4, 4, 0, 0]} />
              <Bar dataKey="improving" name="Mejorando" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="critical" name="Crítico" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-base font-bold text-slate-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Alertas activas
            </h2>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
              {criticalPatients.length + attentionPatients.length}
            </span>
          </div>
          <div className="space-y-3">
            {criticalPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p.id)}
                className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm"
                style={{ background: '#fef2f2', borderColor: '#fecaca' }}
              >
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-rose-100">
                  <AlertTriangle size={13} className="text-rose-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                  <p className="mt-0.5 text-xs text-rose-600">
                    FC: {p.currentMetrics.heartRate} bpm - Estrés: {p.currentMetrics.stressIndex}%
                  </p>
                </div>
              </button>
            ))}
            {attentionPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p.id)}
                className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm"
                style={{ background: '#fffbeb', borderColor: '#fde68a' }}
              >
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle size={13} className="text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                  <p className="mt-0.5 text-xs text-amber-600">
                    Estrés: {p.currentMetrics.stressIndex}% - Requiere revisión
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              className="text-base font-bold text-slate-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Mayor actividad biomédica
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Pacientes con índice de estrés más elevado hoy
            </p>
          </div>
        </div>
        <div>
          {topActivity.map((patient, i) => {
            const status = statusConfig[patient.status]

            return (
              <div key={patient.id}>
                {i > 0 && <div className="mx-0 h-px bg-slate-50" />}
                <button
                  onClick={() => handleSelectPatient(patient.id)}
                  className="group -mx-2 flex w-full items-center gap-4 rounded-xl px-2 py-4 text-left transition-all hover:bg-slate-50/70"
                >
                  <img
                    src={patient.photo}
                    alt={patient.name}
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{patient.name}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ color: status.color, background: status.bg }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{patient.diagnosis}</p>
                  </div>
                  <div className="flex items-center gap-5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Heart size={12} className="text-rose-400" />
                      <span className="mono">{patient.currentMetrics.heartRate}</span>
                      <span className="text-slate-300">bpm</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Droplets size={12} className="text-blue-400" />
                      <span className="mono">{patient.currentMetrics.spo2}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Thermometer size={12} className="text-amber-400" />
                      <span className="mono">{patient.currentMetrics.temperature}°C</span>
                    </div>
                    <div className="hidden items-center gap-2 lg:flex">
                      <span className="text-xs text-slate-400">Estrés</span>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${patient.currentMetrics.stressIndex}%`,
                            background:
                              patient.currentMetrics.stressIndex > 75
                                ? '#ef4444'
                                : patient.currentMetrics.stressIndex > 55
                                  ? '#f59e0b'
                                  : '#10b981',
                          }}
                        />
                      </div>
                      <span className="mono text-xs text-slate-500">
                        {patient.currentMetrics.stressIndex}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="flex-shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-50 px-6 py-5">
          <h2
            className="text-base font-bold text-slate-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Próximas sesiones
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPatient(p.id)}
              className="flex w-full items-center gap-4 px-6 py-4 text-left transition-all hover:bg-slate-50/50"
            >
              <img src={p.photo} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                <p className="truncate text-xs text-slate-400">{p.diagnosis}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={12} />
                <span>{p.nextSession}</span>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ color: statusConfig[p.status].color, background: statusConfig[p.status].bg }}
              >
                {statusConfig[p.status].label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
