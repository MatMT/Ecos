import { PageHeader } from "@/components/common/PageHeader"
import { AssignmentsManager } from "@/features/therapist-assignments/components/AssignmentsManager"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Asignaciones | ECOS",
}

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Asignaciones Clínicas" 
        description="Gestiona qué pacientes están asignados a cada terapeuta y revisa el historial."
      />
      <AssignmentsManager />
    </div>
  )
}

