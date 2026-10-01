import { notFound } from "next/navigation"
import { EditPatientPage } from "@/features/patients/components/edit-patient-page"

interface EditPatientRouteProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: EditPatientRouteProps) {
  const { id } = await params
  const patientId = Number(id)

  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    notFound()
  }

  return <EditPatientPage patientId={patientId} />
}
