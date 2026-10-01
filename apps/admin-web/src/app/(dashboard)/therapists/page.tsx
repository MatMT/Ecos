import { PageHeader } from "@/components/common/PageHeader"
import { TherapistList } from "@/features/therapists/components/TherapistList"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terapeutas | ECOS",
}

export default function TherapistsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Terapeutas" 
        description="Gestiona el equipo de profesionales de la salud mental."
        actions={
          <Button asChild>
            <Link href="/therapists/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> 
              Nuevo Terapeuta
            </Link>
          </Button>
        }
      />
      <TherapistList />
    </div>
  )
}
