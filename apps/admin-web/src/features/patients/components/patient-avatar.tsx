import { getPatientInitials } from "@/features/patients/utils/patient-initials"
import { cn } from "@/lib/utils"

const avatarToneClassNames = [
  "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
] as const

interface PatientAvatarProps {
  className?: string
  fullName: string | null | undefined
  patientId: number
}

export function PatientAvatar({
  className,
  fullName,
  patientId,
}: PatientAvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        avatarToneClassNames[getAvatarToneIndex(patientId)],
        className,
      )}
    >
      {getPatientInitials(fullName)}
    </div>
  )
}

function getAvatarToneIndex(patientId: number): number {
  return Math.abs(patientId) % avatarToneClassNames.length
}
