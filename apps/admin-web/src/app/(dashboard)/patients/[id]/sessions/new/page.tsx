import { notFound } from "next/navigation"
import { NewSessionPage } from "@/features/sessions/components/new-session-page"

interface NewSessionRouteProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: NewSessionRouteProps) {
  const { id } = await params
  const patientId = Number(id)

  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    notFound()
  }

  return <NewSessionPage patientId={patientId} />
}
