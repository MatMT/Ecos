import type { StatusBadgeTone } from "@/components/common/StatusBadge"

interface OverviewStatusPresentation {
  label: string
  tone: StatusBadgeTone
}

const statusPresentations: Readonly<Record<string, OverviewStatusPresentation>> =
  {
    active: { label: "Activo", tone: "success" },
    assigned: { label: "Asignada", tone: "warning" },
    cancelled: { label: "Cancelada", tone: "danger" },
    closed: { label: "Cerrada", tone: "neutral" },
    completed: { label: "Completada", tone: "success" },
    confirmed: { label: "Confirmada", tone: "success" },
    in_follow_up: { label: "En seguimiento", tone: "warning" },
    in_progress: { label: "En progreso", tone: "warning" },
    new: { label: "Nueva", tone: "info" },
    no_show: { label: "No asistió", tone: "danger" },
    pending: { label: "Pendiente", tone: "warning" },
    rescheduled: { label: "Reprogramada", tone: "info" },
    resolved: { label: "Resuelta", tone: "success" },
    reviewed: { label: "Revisada", tone: "info" },
  }

const priorityPresentations: Readonly<Record<string, OverviewStatusPresentation>> =
  {
    critical: { label: "Crítica", tone: "danger" },
    high: { label: "Alta", tone: "danger" },
    low: { label: "Baja", tone: "info" },
    medium: { label: "Media", tone: "warning" },
  }

export function formatOverviewDate(
  value: string | null,
  timeZone?: string,
): string {
  if (!value || Number.isNaN(Date.parse(value))) {
    return "Fecha no registrada"
  }

  return formatDate(
    value,
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    timeZone,
  )
}

export function formatOverviewDateTime(
  value: string | null,
  timeZone?: string,
): string {
  if (!value || Number.isNaN(Date.parse(value))) {
    return "Fecha y hora no registradas"
  }

  return formatDate(
    value,
    {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "long",
      year: "numeric",
    },
    timeZone,
  )
}

export function formatOverviewNumber(value: number | null): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat("es-GT", { maximumFractionDigits: 1 }).format(value)
}

export function formatAppointmentModality(value: string): string {
  const labels: Readonly<Record<string, string>> = {
    in_person: "Presencial",
    online: "En línea",
    virtual: "Virtual",
  }

  return labels[value] ?? "Modalidad registrada"
}

export function formatAppointmentType(value: string): string {
  const labels: Readonly<Record<string, string>> = {
    follow_up: "Seguimiento",
    individual: "Individual",
    initial: "Inicial",
    intake: "Valoración inicial",
  }

  return labels[value] ?? "Tipo de cita registrado"
}

export function getOverviewStatusPresentation(
  value: string | null,
): OverviewStatusPresentation {
  return value
    ? (statusPresentations[value] ?? {
        label: "Estado registrado",
        tone: "neutral",
      })
    : { label: "Sin estado registrado", tone: "neutral" }
}

export function getPriorityPresentation(
  value: string | null,
): OverviewStatusPresentation {
  return value
    ? (priorityPresentations[value] ?? {
        label: "Prioridad registrada",
        tone: "neutral",
      })
    : { label: "Sin prioridad registrada", tone: "neutral" }
}

export function getActivityOriginPresentation(
  value: string,
): OverviewStatusPresentation {
  const labels: Readonly<Record<string, string>> = {
    ecos: "ECOS",
    psychologist: "Terapeuta",
  }

  return {
    label: labels[value] ?? "Origen registrado",
    tone: "info",
  }
}

export function formatSharedContentType(value: string): string {
  const labels: Readonly<Record<string, string>> = {
    document: "Documento",
    link: "Enlace",
    resource: "Recurso",
  }

  return labels[value] ?? "Contenido registrado"
}

function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): string {
  try {
    return new Intl.DateTimeFormat("es-GT", {
      ...options,
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date(value))
  } catch {
    return new Intl.DateTimeFormat("es-GT", options).format(new Date(value))
  }
}
