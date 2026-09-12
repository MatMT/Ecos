'use client'

import { useState, type FC } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Wifi } from 'lucide-react'
// import { patients } from '../data/mockData'
// import type { PatientStatus } from '../data/mockData'

const statusConfig: Record<
  PatientStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  critical: { label: 'Crítico', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  attention: { label: 'Atención', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  stable: { label: 'Estable', color: '#1a7dbf', bg: '#eff6ff', border: '#bfdbfe', dot: '#1a7dbf' },
  good: { label: 'Óptimo', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' },
}

const Patients: FC = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PatientStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter

    return matchSearch && matchFilter
  })

  return (
    <div className="max-w-7xl p-8">
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Mis Usuarios
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {patients.length} Usuarios Registrados -{' '}
            {patients.filter((p) => p.status !== 'good' && p.status !== 'stable').length}{' '}
            requieren seguimiento
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1a7dbf, #2d96dc)' }}
        >
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente o diagnóstico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'critical', 'attention', 'stable', 'good'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-xl border px-3 py-2 text-xs font-medium transition-all"
              style={
                filter === f
                  ? { background: '#1a7dbf', color: '#fff', borderColor: '#1a7dbf' }
                  : { background: '#fff', color: '#64748b', borderColor: '#e2e8f0' }
              }
            >
              {f === 'all' ? 'Todos' : statusConfig[f as PatientStatus].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((patient) => {
          const status = statusConfig[patient.status]

          return (
            <button
              key={patient.id}
              onClick={() => router.push(`/patients/${patient.id}`)}
              className="group rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md"
              style={{ borderColor: '#e2e8f0' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = status.border
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={patient.photo}
                    alt={patient.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
                    style={{ background: status.dot }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-bold text-slate-800"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {patient.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {patient.age} años - {patient.gender === 'F' ? 'Femenino' : 'Masculino'}
                  </p>
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ color: status.color, background: status.bg }}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {patient.diagnosis}
              </p>

              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <p className="mono text-xs font-semibold text-rose-500">
                    {patient.currentMetrics.heartRate}
                  </p>
                  <p className="text-xs text-slate-400">bpm</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <p className="mono text-xs font-semibold text-blue-500">
                    {patient.currentMetrics.spo2}%
                  </p>
                  <p className="text-xs text-slate-400">SpO2</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <p
                    className="mono text-xs font-semibold"
                    style={{
                      color:
                        patient.currentMetrics.stressIndex > 75
                          ? '#ef4444'
                          : patient.currentMetrics.stressIndex > 55
                            ? '#f59e0b'
                            : '#10b981',
                    }}
                  >
                    {patient.currentMetrics.stressIndex}%
                  </p>
                  <p className="text-xs text-slate-400">Estrés</p>
                </div>
              </div>

              <div
                className="flex items-start gap-2 rounded-xl p-3"
                style={{
                  background:
                    patient.aiStatus === 'critical'
                      ? '#fef2f2'
                      : patient.aiStatus === 'elevated'
                        ? '#fffbeb'
                        : '#f0fdf4',
                }}
              >
                <div
                  className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      patient.aiStatus === 'critical'
                        ? '#ef4444'
                        : patient.aiStatus === 'elevated'
                          ? '#f59e0b'
                          : '#10b981',
                  }}
                >
                  <span className="text-xs font-bold text-white" style={{ fontSize: 8 }}>
                    IA
                  </span>
                </div>
                <p
                  className="line-clamp-2 text-xs leading-relaxed"
                  style={{
                    color:
                      patient.aiStatus === 'critical'
                        ? '#991b1b'
                        : patient.aiStatus === 'elevated'
                          ? '#92400e'
                          : '#14532d',
                  }}
                >
                  {patient.aiInsight}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Wifi size={11} className="text-emerald-400" />
                  <span>Pulsera activa</span>
                </div>
                <div className="text-xs text-slate-400">
                  Próx: <span className="font-medium text-slate-600">{patient.nextSession}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2
                className="text-lg font-bold text-slate-800"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Nuevo Paciente
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-lg font-light text-slate-400 transition-colors hover:text-slate-600"
              >
                x
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nombre
                  </label>
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Nombre" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Apellido
                  </label>
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Apellido" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Edad
                  </label>
                  <input type="number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Edad" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Género
                  </label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    <option value="">Seleccionar</option>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Correo electrónico
                </label>
                <input type="email" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Diagnóstico inicial
                </label>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Diagnóstico inicial" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1a7dbf, #2d96dc)' }}
              >
                Registrar Paciente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients
