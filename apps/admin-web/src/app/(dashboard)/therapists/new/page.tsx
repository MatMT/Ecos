import { PageHeader } from "@/components/common/PageHeader"
import { TherapistCreateForm } from "@/features/therapists/components/TherapistCreateForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nuevo Terapeuta | ECOS",
}

export default function NewTherapistPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Registrar Terapeuta" 
        description="Añade un nuevo profesional al sistema. Esto creará sus credenciales de acceso de forma automática."
      />
      <div className="max-w-2xl">
        <TherapistCreateForm />
      </div>
    </div>
  )
}
