export type PatientStatus = 'stable' | 'attention' | 'critical' | 'good'

export interface Patient {
  id: string
  name: string
  age: number
  gender: 'M' | 'F'
  photo: string
  diagnosis: string
  therapist: string
  nextSession: string
  lastSession: string
  status: PatientStatus
  phone: string
  email: string
  sessions: number
  joinDate: string
  currentMetrics: BiometricSnapshot
  weeklyData: DailyBiometrics[]
  sessions_history: SessionRecord[]
  aiInsight: string
  aiStatus: 'optimal' | 'moderate' | 'elevated' | 'critical'
}

export interface BiometricSnapshot {
  heartRate: number
  systolic: number
  diastolic: number
  spo2: number
  temperature: number
  stressIndex: number
  respiratoryRate: number
  timestamp: string
}

export interface DailyBiometrics {
  day: string
  heartRate: number
  systolic: number
  diastolic: number
  spo2: number
  temperature: number
  stressIndex: number
}

export interface SessionRecord {
  id: string
  date: string
  type: string
  duration: number
  notes: string
  diagnosis: string
  emotionalState: string
  observations: string
}

export const patients: Patient[] = [
  {
    id: 'p001',
    name: 'Valentina Morales',
    age: 29,
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&auto=format',
    diagnosis: 'Trastorno de ansiedad generalizada',
    therapist: 'Dr. Carlos Mendez',
    nextSession: '2026-07-24',
    lastSession: '2026-07-17',
    status: 'attention',
    phone: '+57 300 456 7890',
    email: 'valentina.morales@email.com',
    sessions: 14,
    joinDate: '2026-01-10',
    aiStatus: 'elevated',
    aiInsight:
      'Niveles de cortisol elevados detectados. Frecuencia cardíaca en reposo por encima del umbral habitual. Se recomienda técnicas de respiración guiada en la próxima sesión.',
    currentMetrics: {
      heartRate: 89,
      systolic: 132,
      diastolic: 84,
      spo2: 97,
      temperature: 36.8,
      stressIndex: 72,
      respiratoryRate: 18,
      timestamp: '2026-07-22T10:34:00',
    },
    weeklyData: [
      { day: 'Lun', heartRate: 84, systolic: 128, diastolic: 82, spo2: 97, temperature: 36.6, stressIndex: 65 },
      { day: 'Mar', heartRate: 91, systolic: 135, diastolic: 87, spo2: 96, temperature: 36.9, stressIndex: 78 },
      { day: 'Mié', heartRate: 87, systolic: 130, diastolic: 83, spo2: 97, temperature: 36.7, stressIndex: 70 },
      { day: 'Jue', heartRate: 93, systolic: 138, diastolic: 89, spo2: 96, temperature: 37.0, stressIndex: 82 },
      { day: 'Vie', heartRate: 86, systolic: 131, diastolic: 84, spo2: 97, temperature: 36.8, stressIndex: 68 },
      { day: 'Sáb', heartRate: 80, systolic: 125, diastolic: 80, spo2: 98, temperature: 36.6, stressIndex: 55 },
      { day: 'Hoy', heartRate: 89, systolic: 132, diastolic: 84, spo2: 97, temperature: 36.8, stressIndex: 72 },
    ],
    sessions_history: [
      {
        id: 's1',
        date: '2026-07-17',
        type: 'Terapia cognitivo-conductual',
        duration: 50,
        notes: 'Paciente reporta episodios de preocupación excesiva durante la semana.',
        diagnosis: 'TAG - Episodio moderado',
        emotionalState: 'Ansiosa, moderadamente estresada',
        observations:
          'Se trabajaron técnicas de reestructuración cognitiva. Buena respuesta a ejercicios de mindfulness.',
      },
      {
        id: 's2',
        date: '2026-07-10',
        type: 'Seguimiento biomédico',
        duration: 40,
        notes: 'Métricas cardíacas estables comparadas con la semana anterior.',
        diagnosis: 'TAG - Sin cambios significativos',
        emotionalState: 'Estable, ligeramente ansiosa',
        observations: 'Paciente refiere mejoría en calidad de sueño.',
      },
    ],
  },
  {
    id: 'p002',
    name: 'Santiago Ruiz',
    age: 35,
    gender: 'M',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format',
    diagnosis: 'Depresión mayor recurrente',
    therapist: 'Dr. Carlos Mendez',
    nextSession: '2026-07-25',
    lastSession: '2026-07-18',
    status: 'stable',
    phone: '+57 310 234 5678',
    email: 'santiago.ruiz@email.com',
    sessions: 22,
    joinDate: '2025-11-05',
    aiStatus: 'moderate',
    aiInsight:
      'Signos vitales dentro de parámetros normales. Variabilidad cardíaca mejorada respecto al mes anterior. Estado emocional en progresión positiva. Continuar con el plan terapéutico actual.',
    currentMetrics: {
      heartRate: 68,
      systolic: 118,
      diastolic: 76,
      spo2: 98,
      temperature: 36.5,
      stressIndex: 42,
      respiratoryRate: 14,
      timestamp: '2026-07-22T09:15:00',
    },
    weeklyData: [
      { day: 'Lun', heartRate: 70, systolic: 120, diastolic: 78, spo2: 98, temperature: 36.5, stressIndex: 45 },
      { day: 'Mar', heartRate: 72, systolic: 122, diastolic: 79, spo2: 97, temperature: 36.6, stressIndex: 48 },
      { day: 'Mié', heartRate: 67, systolic: 116, diastolic: 75, spo2: 98, temperature: 36.4, stressIndex: 38 },
      { day: 'Jue', heartRate: 69, systolic: 119, diastolic: 77, spo2: 98, temperature: 36.5, stressIndex: 40 },
      { day: 'Vie', heartRate: 71, systolic: 121, diastolic: 78, spo2: 98, temperature: 36.6, stressIndex: 44 },
      { day: 'Sáb', heartRate: 65, systolic: 115, diastolic: 74, spo2: 99, temperature: 36.3, stressIndex: 32 },
      { day: 'Hoy', heartRate: 68, systolic: 118, diastolic: 76, spo2: 98, temperature: 36.5, stressIndex: 42 },
    ],
    sessions_history: [
      {
        id: 's1',
        date: '2026-07-18',
        type: 'Terapia interpersonal',
        duration: 55,
        notes: 'Notable mejoría en el ánimo general. Retomó actividades sociales.',
        diagnosis: 'Depresión mayor - Remisión parcial',
        emotionalState: 'Estable, motivado',
        observations: 'Paciente muestra progreso consistente. Reducir frecuencia de sesiones a considerar.',
      },
    ],
  },
  {
    id: 'p003',
    name: 'Laura Jiménez',
    age: 24,
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&auto=format',
    diagnosis: 'Trastorno de pánico',
    therapist: 'Dr. Carlos Mendez',
    nextSession: '2026-07-23',
    lastSession: '2026-07-15',
    status: 'critical',
    phone: '+57 320 789 0123',
    email: 'laura.jimenez@email.com',
    sessions: 8,
    joinDate: '2026-04-20',
    aiStatus: 'critical',
    aiInsight:
      'ALERTA: Frecuencia cardíaca elevada de forma sostenida (>95 bpm en reposo). Presión arterial sistólica por encima del umbral. Índice de estrés crítico (88/100). Se recomienda contacto inmediato con el paciente.',
    currentMetrics: {
      heartRate: 98,
      systolic: 145,
      diastolic: 92,
      spo2: 95,
      temperature: 37.2,
      stressIndex: 88,
      respiratoryRate: 22,
      timestamp: '2026-07-22T11:02:00',
    },
    weeklyData: [
      { day: 'Lun', heartRate: 88, systolic: 138, diastolic: 88, spo2: 96, temperature: 37.0, stressIndex: 75 },
      { day: 'Mar', heartRate: 95, systolic: 142, diastolic: 91, spo2: 95, temperature: 37.1, stressIndex: 83 },
      { day: 'Mié', heartRate: 90, systolic: 140, diastolic: 89, spo2: 96, temperature: 37.0, stressIndex: 78 },
      { day: 'Jue', heartRate: 102, systolic: 148, diastolic: 94, spo2: 94, temperature: 37.3, stressIndex: 91 },
      { day: 'Vie', heartRate: 97, systolic: 144, diastolic: 91, spo2: 95, temperature: 37.1, stressIndex: 85 },
      { day: 'Sáb', heartRate: 93, systolic: 141, diastolic: 90, spo2: 96, temperature: 37.0, stressIndex: 80 },
      { day: 'Hoy', heartRate: 98, systolic: 145, diastolic: 92, spo2: 95, temperature: 37.2, stressIndex: 88 },
    ],
    sessions_history: [
      {
        id: 's1',
        date: '2026-07-15',
        type: 'Crisis - Intervención de emergencia',
        duration: 70,
        notes: 'Paciente reportó episodio de pánico severo el día anterior.',
        diagnosis: 'Trastorno de pánico - Episodio agudo',
        emotionalState: 'Muy ansiosa, taquicardia',
        observations:
          'Se realizó intervención en crisis. Técnicas de anclaje sensorial. Requiere seguimiento diario.',
      },
    ],
  },
  {
    id: 'p004',
    name: 'Andrés Castillo',
    age: 42,
    gender: 'M',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&auto=format',
    diagnosis: 'Estrés postraumático',
    therapist: 'Dr. Carlos Mendez',
    nextSession: '2026-07-30',
    lastSession: '2026-07-14',
    status: 'good',
    phone: '+57 315 567 8901',
    email: 'andres.castillo@email.com',
    sessions: 31,
    joinDate: '2025-08-15',
    aiStatus: 'optimal',
    aiInsight:
      'Estado Óptimo. Todos los indicadores biomédicos dentro de rangos saludables. Variabilidad cardíaca excelente. El paciente muestra estabilidad sostenida durante las últimas 3 semanas.',
    currentMetrics: {
      heartRate: 62,
      systolic: 112,
      diastolic: 72,
      spo2: 99,
      temperature: 36.4,
      stressIndex: 28,
      respiratoryRate: 13,
      timestamp: '2026-07-22T08:45:00',
    },
    weeklyData: [
      { day: 'Lun', heartRate: 63, systolic: 113, diastolic: 73, spo2: 99, temperature: 36.4, stressIndex: 30 },
      { day: 'Mar', heartRate: 65, systolic: 115, diastolic: 74, spo2: 99, temperature: 36.5, stressIndex: 33 },
      { day: 'Mié', heartRate: 61, systolic: 111, diastolic: 71, spo2: 99, temperature: 36.3, stressIndex: 26 },
      { day: 'Jue', heartRate: 64, systolic: 114, diastolic: 73, spo2: 99, temperature: 36.4, stressIndex: 31 },
      { day: 'Vie', heartRate: 60, systolic: 110, diastolic: 70, spo2: 99, temperature: 36.3, stressIndex: 24 },
      { day: 'Sáb', heartRate: 58, systolic: 108, diastolic: 69, spo2: 99, temperature: 36.2, stressIndex: 20 },
      { day: 'Hoy', heartRate: 62, systolic: 112, diastolic: 72, spo2: 99, temperature: 36.4, stressIndex: 28 },
    ],
    sessions_history: [
      {
        id: 's1',
        date: '2026-07-14',
        type: 'EMDR - Desensibilización',
        duration: 60,
        notes: 'Paciente maneja bien los estímulos asociados al trauma.',
        diagnosis: 'TEPT - Remisión significativa',
        emotionalState: 'Tranquilo, ecuánime',
        observations: 'Excelente avance terapéutico. Considerar alta en 2 meses.',
      },
    ],
  },
  {
    id: 'p005',
    name: 'Isabel Torres',
    age: 31,
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&auto=format',
    diagnosis: 'Trastorno bipolar tipo II',
    therapist: 'Dr. Carlos Mendez',
    nextSession: '2026-07-26',
    lastSession: '2026-07-19',
    status: 'attention',
    phone: '+57 305 890 1234',
    email: 'isabel.torres@email.com',
    sessions: 17,
    joinDate: '2026-02-08',
    aiStatus: 'moderate',
    aiInsight:
      'Variabilidad en métricas cardíacas sugiere posible fase hipomaniaca inicial. Temperatura corporal ligeramente elevada. Monitorear patrones de sueño. Revisar medicación en próxima consulta.',
    currentMetrics: {
      heartRate: 76,
      systolic: 124,
      diastolic: 80,
      spo2: 97,
      temperature: 36.9,
      stressIndex: 58,
      respiratoryRate: 16,
      timestamp: '2026-07-22T10:10:00',
    },
    weeklyData: [
      { day: 'Lun', heartRate: 74, systolic: 122, diastolic: 79, spo2: 97, temperature: 36.7, stressIndex: 52 },
      { day: 'Mar', heartRate: 79, systolic: 126, diastolic: 82, spo2: 97, temperature: 37.0, stressIndex: 61 },
      { day: 'Mié', heartRate: 82, systolic: 128, diastolic: 83, spo2: 97, temperature: 37.1, stressIndex: 66 },
      { day: 'Jue', heartRate: 77, systolic: 125, diastolic: 81, spo2: 97, temperature: 36.9, stressIndex: 59 },
      { day: 'Vie', heartRate: 75, systolic: 123, diastolic: 80, spo2: 97, temperature: 36.8, stressIndex: 54 },
      { day: 'Sáb', heartRate: 73, systolic: 121, diastolic: 78, spo2: 98, temperature: 36.7, stressIndex: 49 },
      { day: 'Hoy', heartRate: 76, systolic: 124, diastolic: 80, spo2: 97, temperature: 36.9, stressIndex: 58 },
    ],
    sessions_history: [
      {
        id: 's1',
        date: '2026-07-19',
        type: 'Psicoeducación y regulación emocional',
        duration: 50,
        notes: 'Revisión de registro de estados de ánimo. Ciclo relativamente estable.',
        diagnosis: 'Trastorno bipolar II - Fase estable',
        emotionalState: 'Estable, ligeramente eufórica',
        observations: 'Monitoreo continuo de ciclos. Buena adherencia al tratamiento farmacológico.',
      },
    ],
  },
]

export const dashboardStats = {
  totalPatients: 5,
  activeConsultations: 3,
  atRisk: 1,
  needsAttention: 2,
  sessionsThisWeek: 8,
  improvementRate: 74,
}

export const weeklySessionData = [
  { week: 'Sem 1', sessions: 12, critical: 2, stable: 8, improving: 2 },
  { week: 'Sem 2', sessions: 15, critical: 1, stable: 9, improving: 5 },
  { week: 'Sem 3', sessions: 11, critical: 3, stable: 6, improving: 2 },
  { week: 'Sem 4', sessions: 18, critical: 1, stable: 10, improving: 7 },
  { week: 'Sem 5', sessions: 14, critical: 2, stable: 7, improving: 5 },
  { week: 'Sem 6', sessions: 20, critical: 0, stable: 12, improving: 8 },
]
