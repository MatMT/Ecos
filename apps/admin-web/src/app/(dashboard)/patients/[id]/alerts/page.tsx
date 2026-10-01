import { notFound } from "next/navigation"
import { PatientAlertsPage } from "@/features/alerts/components/patient-alerts-page"

interface AlertsRouteProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: AlertsRouteProps) {
  const { id } = await params
  const patientId = Number(id)

  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    notFound()
  }

  return <PatientAlertsPage patientId={patientId} />
}
