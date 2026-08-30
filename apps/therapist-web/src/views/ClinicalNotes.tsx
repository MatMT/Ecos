'use client'

import { useState, type FC } from 'react'
import {
  Save,
  Clock,
  ChevronDown,
  Brain,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Search,
} from 'lucide-react'
import { patients } from '../data/mockData'

interface ClinicalNotesProps {
  preselectedPatientId?: string
}

const emotionalStates = [
  { value: 'calm', label: 'Tranquilo/a', icon: Smile, color: '#10b981' },
  { value: 'anxious', label: 'Ansioso/a', icon: Meh, color: '#f59e0b' },
  { value: 'sad', label: 'Triste', icon: Frown, color: '#1a7dbf' },
  { value: 'agitated', label: 'Agitado/a', icon: AlertCircle, color: '#ef4444' },
]

const sessionTypes = [
  'Evaluación inicial',
  'Terapia cognitivo-conductual',
  'Terapia interpersonal',
  'EMDR - Desensibilización',
  'Psicoeducación',
  'Seguimiento biomédico',
  'Crisis - Intervención de emergencia',
  'Sesión de cierre',
]

const diagnosticOptions = [
  'TAG - Trastorno de ansiedad generalizada',
  'Depresión mayor - Episodio activo',
  'Depresión mayor - Remisión parcial',
  'Trastorno de pánico - Episodio agudo',
  'TEPT - Fase activa',
  'TEPT - Remisión significativa',
  'Trastorno bipolar II - Fase estable',
  'Trastorno bipolar II - Fase hipomaniaca',
  'Evaluación en proceso',
]

const ClinicalNotes: FC<ClinicalNotesProps> = ({ preselectedPatientId }) => {
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatientId || '')
  const [sessionType, setSessionType] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [emotionalState, setEmotionalState] = useState('')
  const [notes, setNotes] = useState('')
  const [observations, setObservations] = useState('')
  const [duration, setDuration] = useState('50')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const patient = patients.find((p) => p.id === selectedPatient)
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  )
  const allNotes = patients
    .flatMap((p) =>
      p.sessions_history.map((s) => ({ ...s, patientName: p.name, patientPhoto: p.photo }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="max-w-7xl p-8">
      <div className="mb-7">
        <h1
          className="text-2xl font-bold text-slate-800"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Historia Clínica
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Registra sesiones, diagnósticos y observaciones clínicas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2
              className="mb-4 text-sm font-bold text-slate-700"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Seleccionar paciente
            </h2>
            <div className="relative">
              <button
                className="flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all"
                style={{ borderColor: showPatientDropdown ? '#1a7dbf' : '#e2e8f0', background: '#fafbfc' }}
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
              >
                {patient ? (
                  <>
                    <img src={patient.photo} alt={patient.name} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{patient.name}</p>
                      <p className="truncate text-xs text-slate-400">{patient.diagnosis}</p>
                    </div>
                  </>
                ) : (
                  <p className="flex-1 text-sm text-slate-400">Seleccionar paciente...</p>
                )}
                <ChevronDown size={16} className="flex-shrink-0 text-slate-400" />
              </button>
              {showPatientDropdown && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 p-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-7 pr-3 text-xs outline-none focus:border-blue-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-slate-50"
                      onClick={() => {
                        setSelectedPatient(p.id)
                        setShowPatientDropdown(false)
                        setPatientSearch('')
                      }}
                    >
                      <img src={p.photo} alt={p.name} className="h-7 w-7 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{p.name}</p>
                        <p className="truncate text-xs text-slate-400">{p.diagnosis}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2
              className="mb-4 text-sm font-bold text-slate-700"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Datos de la sesión
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tipo de sesión
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccionar tipo...</option>
                  {sessionTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Duración (min)
                </label>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="flex-shrink-0 text-slate-400" />
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="50"
                    min="10"
                    max="180"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fecha de sesión
                </label>
                <input
                  type="date"
                  defaultValue="2026-07-22"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Diagnóstico registrado
                </label>
                <select
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccionar diagnóstico...</option>
                  {diagnosticOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2
              className="mb-4 text-sm font-bold text-slate-700"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Estado emocional observado
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {emotionalStates.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setEmotionalState(emotionalState === value ? '' : value)}
                  className="flex flex-col items-center gap-2 rounded-xl border p-4 transition-all"
                  style={{
                    borderColor: emotionalState === value ? color : '#e2e8f0',
                    background: emotionalState === value ? `${color}15` : '#fafbfc',
                  }}
                >
                  <Icon size={22} style={{ color: emotionalState === value ? color : '#94a3b8' }} />
                  <span className="text-xs font-medium" style={{ color: emotionalState === value ? color : '#64748b' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2
              className="text-sm font-bold text-slate-700"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Notas y observaciones
            </h2>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notas de la sesión
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Describe el desarrollo de la sesión, temas tratados, respuesta del paciente..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Observaciones clínicas
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                placeholder="Observaciones, patrones detectados, recomendaciones terapéuticas..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {patient && (
            <div
              className="rounded-2xl border p-5"
              style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', borderColor: '#bfdbfe' }}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                  <Brain size={14} className="text-white" />
                </div>
                <p
                  className="text-sm font-bold text-slate-800"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Interpretación IA del paciente
                </p>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{patient.aiInsight}</p>
              <p className="mt-3 text-xs font-medium text-blue-500">
                Basado en métricas biomédicas de hoy - Ecos Therapist AI
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50">
              Guardar borrador
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
              style={{ background: savedSuccess ? '#10b981' : 'linear-gradient(135deg, #1a7dbf, #2d96dc)' }}
            >
              <Save size={15} />
              {savedSuccess ? 'Guardado exitosamente' : 'Guardar historia clínica'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-50 px-5 py-4">
              <h3
                className="text-sm font-bold text-slate-700"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Registros recientes
              </h3>
            </div>
            <div className="max-h-[600px] divide-y divide-slate-50 overflow-y-auto">
              {allNotes.map((note, i) => (
                <div key={i} className="px-5 py-4 transition-all hover:bg-slate-50">
                  <div className="mb-2 flex items-center gap-2.5">
                    <img src={note.patientPhoto} alt={note.patientName} className="h-7 w-7 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{note.patientName}</p>
                      <p className="text-xs text-slate-400">{note.date}</p>
                    </div>
                  </div>
                  <p className="mb-1 text-xs font-medium text-blue-600">{note.type}</p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{note.notes}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Clock size={10} className="text-slate-300" />
                    <span className="text-xs text-slate-400">{note.duration} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3
              className="mb-4 text-sm font-bold text-slate-700"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Estadísticas del mes
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Total sesiones', value: 38, color: '#1a7dbf' },
                { label: 'Pacientes tratados', value: 5, color: '#10b981' },
                { label: 'Horas de terapia', value: '31.5h', color: '#8b5cf6' },
                { label: 'Sesiones de crisis', value: 2, color: '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="mono text-sm font-bold" style={{ color }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClinicalNotes
