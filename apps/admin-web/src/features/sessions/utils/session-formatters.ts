import {
  formatOverviewDateTime,
  getOverviewStatusPresentation,
} from "@/features/patients/utils/patient-overview-formatters"

const sessionTypeLabels: Readonly<Record<string, string>> = {
  follow_up: "Seguimiento",
  individual: "Individual",
  initial: "Consulta inicial",
  intake: "Valoración inicial",
}

const modalityLabels: Readonly<Record<string, string>> = {
  in_person: "Presencial",
  online: "En línea",
  virtual: "Virtual",
}

const emotionalStateLabels: Readonly<Record<string, string>> = {
  anxious: "Ansioso",
  calm: "Tranquilo",
  euphoric: "Eufórico",
  other: "Otro",
  sad: "Triste",
}

export function formatSessionDateTime(
  value: string | null,
  timeZone: string,
): string {
  return formatOverviewDateTime(value, timeZone)
}

export function formatSessionType(value: string | null): string {
  if (!value) {
    return "Sesión clínica"
  }

  return sessionTypeLabels[value] ?? value
}

export function formatSessionModality(value: string): string {
  return modalityLabels[value] ?? value
}

export function formatObservedEmotionalState(value: string): string {
  return emotionalStateLabels[value] ?? "Estado emocional registrado"
}

export function getAppointmentStatusPresentation(value: string | null) {
  return getOverviewStatusPresentation(value)
}
