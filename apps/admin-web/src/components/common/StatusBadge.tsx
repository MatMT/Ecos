import { Badge } from "@/components/ui/badge"

type StatusBadgeTone = "danger" | "info" | "neutral" | "success" | "warning"

interface StatusBadgeProps {
  label: string
  tone: StatusBadgeTone
}

const toneVariants = {
  danger: "destructive",
  info: "info",
  neutral: "secondary",
  success: "success",
  warning: "warning",
} as const

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <Badge variant={toneVariants[tone]}>{label}</Badge>
}

export type { StatusBadgeTone }
