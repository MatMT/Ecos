import { PageHeader } from "@/components/common/PageHeader"
import { TherapistProfile } from "@/features/therapists/components/TherapistProfile"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Perfil del Terapeuta | ECOS",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TherapistDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Perfil del Terapeuta" 
      />
      <TherapistProfile therapistId={id} />
    </div>
  )
}
