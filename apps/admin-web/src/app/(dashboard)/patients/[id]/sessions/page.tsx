import { notFound } from "next/navigation"
import { SessionsPage } from "@/features/sessions/components/sessions-page"

interface SessionsRouteProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: SessionsRouteProps) {
  const { id } = await params
  const patientId = Number(id)

  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    notFound()
  }

  return <SessionsPage patientId={patientId} />
}
