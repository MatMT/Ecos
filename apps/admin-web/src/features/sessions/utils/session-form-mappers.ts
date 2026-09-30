import type {
  CreateManualSessionInput,
  ObservedEmotionalState,
  SessionModality,
} from "@/features/sessions/types/session.types"
import type { SessionFormValues } from "@/features/sessions/schemas/session-form.schema"

export const EMPTY_SESSION_FORM_VALUES: SessionFormValues = {
  agreements: "",
  clinicalImpression: "",
  durationMinutes: "",
  followUpPlan: "",
  interventions: "",
  modality: "",
  observations: "",
  observedEmotionalState: "",
  sessionDate: "",
  sessionDiagnosis: "",
  sessionSummary: "",
  sessionType: "",
}

export function getDefaultSessionDate(timeZone: string): string {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date())
  const values = Object.fromEntries(
    dateParts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

export function toCreateManualSessionInput(
  values: SessionFormValues,
  timeZone: string,
): CreateManualSessionInput {
  return {
    agreements: toOptionalText(values.agreements),
    clinicalImpression: toOptionalText(values.clinicalImpression),
    durationMinutes: toOptionalPositiveInteger(values.durationMinutes),
    followUpPlan: toOptionalText(values.followUpPlan),
    interventions: toOptionalText(values.interventions),
    modality: toOptionalModality(values.modality),
    observations: toOptionalText(values.observations),
    observedEmotionalState: toOptionalEmotionalState(values.observedEmotionalState),
    sessionDate: zonedDateTimeToIso(values.sessionDate, timeZone),
    sessionDiagnosis: toOptionalText(values.sessionDiagnosis),
    sessionSummary: toOptionalText(values.sessionSummary),
    sessionType: toOptionalText(values.sessionType),
  }
}

function toOptionalText(value: string): string | undefined {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function toOptionalPositiveInteger(value: string): number | undefined {
  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function toOptionalModality(value: SessionFormValues["modality"]): SessionModality | undefined {
  return value || undefined
}

function toOptionalEmotionalState(
  value: SessionFormValues["observedEmotionalState"],
): ObservedEmotionalState | undefined {
  return value || undefined
}

function zonedDateTimeToIso(value: string, timeZone: string): string {
  const utcGuess = new Date(`${value}:00.000Z`)
  const initialOffset = getTimeZoneOffset(utcGuess, timeZone)
  const candidate = new Date(utcGuess.getTime() - initialOffset)
  const resolvedOffset = getTimeZoneOffset(candidate, timeZone)

  return new Date(utcGuess.getTime() - resolvedOffset).toISOString()
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const timeZoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value

  if (!timeZoneName || timeZoneName === "GMT") {
    return 0
  }

  const match = timeZoneName.match(/^GMT([+-])(\d{2}):(\d{2})$/)
  if (!match) {
    return 0
  }

  const offset = Number(match[2]) * 60 + Number(match[3])
  return match[1] === "+" ? offset * 60_000 : -offset * 60_000
}
