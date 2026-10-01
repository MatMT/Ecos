import type { StatusBadgeTone } from "@/components/common/StatusBadge"
import type {
  AlertPriority,
  AlertStatus,
  AlertType,
} from "@/features/alerts/types/alert.types"

interface AlertPresentation {
  label: string
  tone: StatusBadgeTone
}

const statusPresentations: Readonly<Record<AlertStatus, AlertPresentation>> = {
  new: { label: "Nueva", tone: "warning" },
  reviewed: { label: "Revisada", tone: "info" },
  in_follow_up: { label: "En seguimiento", tone: "warning" },
  closed: { label: "Cerrada", tone: "success" },
}

const priorityPresentations: Readonly<Record<AlertPriority, AlertPresentation>> = {
  low: { label: "Prioridad baja", tone: "info" },
  medium: { label: "Prioridad media", tone: "warning" },
  high: { label: "Prioridad alta", tone: "danger" },
  critical: { label: "Prioridad crítica", tone: "danger" },
}

const typeLabels: Readonly<Record<AlertType, string>> = {
  panic_button: "SOS / Botón de pánico",
  biometric_anomaly: "Anomalía biométrica registrada",
  ai_risk: "Riesgo de IA registrado",
}

export function getAlertStatusPresentation(status: AlertStatus): AlertPresentation {
  return statusPresentations[status]
}

export function getAlertPriorityPresentation(
  priority: AlertPriority | null,
): AlertPresentation | null {
  return priority ? priorityPresentations[priority] : null
}

export function formatAlertType(alertType: AlertType | null): string {
  return alertType ? typeLabels[alertType] : "Tipo de alerta no registrado"
}
