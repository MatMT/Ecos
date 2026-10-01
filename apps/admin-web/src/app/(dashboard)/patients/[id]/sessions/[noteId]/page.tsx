import { notFound } from "next/navigation"
import { SessionDetailPage } from "@/features/sessions/components/session-detail-page"

interface SessionDetailRouteProps {
  params: Promise<{
    id: string
    noteId: string
  }>
}

export default async function Page({ params }: SessionDetailRouteProps) {
  const { id, noteId } = await params
  const patientId = Number(id)
  const parsedNoteId = Number(noteId)

  if (
    !Number.isSafeInteger(patientId) ||
    patientId < 1 ||
    !Number.isSafeInteger(parsedNoteId) ||
    parsedNoteId < 1
  ) {
    notFound()
  }

  return <SessionDetailPage noteId={parsedNoteId} patientId={patientId} />
}
