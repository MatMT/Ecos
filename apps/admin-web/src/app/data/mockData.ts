type MockPatientStatus = "attention" | "critical" | "good" | "stable"
type MockAiStatus = "critical" | "elevated" | "moderate" | "optimal"

interface MockPatientMetric {
  heartRate: number
  respiratoryRate: number
  spo2: number
  stressIndex: number
  systolic: number
  diastolic: number
  temperature: number
  timestamp: string
}

interface MockWeeklyMetric {
  day: string
  heartRate: number
  systolic: number
  diastolic: number
  spo2: number
  stressIndex: number
}

interface MockSessionHistory {
  date: string
  diagnosis: string
  duration: number
  emotionalState: string
  id: string
  notes: string
  observations: string
  type: string
}

interface MockPatient {
  age: number
  aiInsight: string
  aiStatus: MockAiStatus
  currentMetrics: MockPatientMetric
  diagnosis: string
  email: string
  gender: "F" | "M"
  id: string
  name: string
  nextSession: string
  phone: string
  photo: string
  sessions: number
  sessions_history: readonly MockSessionHistory[]
  status: MockPatientStatus
  weeklyData: readonly MockWeeklyMetric[]
}

const anaWeeklyData: readonly MockWeeklyMetric[] = [
  { day: "Lun", heartRate: 82, systolic: 128, diastolic: 82, spo2: 97, stressIndex: 58 },
  { day: "Mar", heartRate: 79, systolic: 124, diastolic: 80, spo2: 98, stressIndex: 54 },
  { day: "Mié", heartRate: 84, systolic: 130, diastolic: 84, spo2: 97, stressIndex: 61 },
  { day: "Jue", heartRate: 78, systolic: 122, diastolic: 79, spo2: 98, stressIndex: 52 },
  { day: "Vie", heartRate: 80, systolic: 126, diastolic: 81, spo2: 97, stressIndex: 56 },
]

export const patients: readonly MockPatient[] = [
  {
    age: 22,
    aiInsight:
      "Se recomienda mantener el seguimiento programado y revisar la evolución del índice de estrés.",
    aiStatus: "elevated",
    currentMetrics: {
      heartRate: 80,
      respiratoryRate: 16,
      spo2: 97,
      stressIndex: 56,
      systolic: 126,
      diastolic: 81,
      temperature: 36.7,
      timestamp: "2026-09-27T10:30:00.000Z",
    },
    diagnosis: "Seguimiento psicológico general",
    email: "ana.martinez@ejemplo.edu",
    gender: "F",
    id: "1",
    name: "Ana Martínez",
    nextSession: "30 sep., 10:00",
    phone: "+503 7000-1001",
    photo: "https://i.pravatar.cc/160?img=47",
    sessions: 8,
    sessions_history: [
      {
        date: "23 sep. 2026",
        diagnosis: "Seguimiento psicológico general",
        duration: 50,
        emotionalState: "Estable",
        id: "session-1",
        notes: "Se registró una evolución favorable frente a los objetivos establecidos.",
        observations: "Mantener las actividades de autocuidado acordadas.",
        type: "Sesión de seguimiento",
      },
    ],
    status: "attention",
    weeklyData: anaWeeklyData,
  },
  {
    age: 20,
    aiInsight:
      "Los indicadores simulados se mantienen dentro del rango esperado para seguimiento rutinario.",
    aiStatus: "optimal",
    currentMetrics: {
      heartRate: 72,
      respiratoryRate: 15,
      spo2: 98,
      stressIndex: 32,
      systolic: 118,
      diastolic: 76,
      temperature: 36.5,
      timestamp: "2026-09-27T09:15:00.000Z",
    },
    diagnosis: "Acompañamiento preventivo",
    email: "carlos.lopez@ejemplo.edu",
    gender: "M",
    id: "2",
    name: "Carlos López",
    nextSession: "2 oct., 14:00",
    phone: "+503 7000-1002",
    photo: "https://i.pravatar.cc/160?img=12",
    sessions: 5,
    sessions_history: [
      {
        date: "20 sep. 2026",
        diagnosis: "Acompañamiento preventivo",
        duration: 45,
        emotionalState: "Tranquilo",
        id: "session-2",
        notes: "Se mantuvo la adherencia a las recomendaciones preventivas.",
        observations: "Continuar con la rutina acordada.",
        type: "Sesión de seguimiento",
      },
    ],
    status: "good",
    weeklyData: anaWeeklyData,
  },
]
