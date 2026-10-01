import { notFound } from "next/navigation"
import { AlertDetailPage } from "@/features/alerts/components/alert-detail-page"

interface AlertDetailRouteProps {
  params: Promise<{
    alertId: string
    id: string
  }>
}

export default async function Page({ params }: AlertDetailRouteProps) {
  const { alertId, id } = await params
  const patientId = Number(id)
  const parsedAlertId = Number(alertId)

  if (
    !Number.isSafeInteger(patientId) ||
    patientId < 1 ||
    !Number.isSafeInteger(parsedAlertId) ||
    parsedAlertId < 1
  ) {
    notFound()
  }

  return <AlertDetailPage alertId={parsedAlertId} patientId={patientId} />
}
