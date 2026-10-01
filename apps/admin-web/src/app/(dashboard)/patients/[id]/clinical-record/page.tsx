import { notFound } from "next/navigation"
import { ClinicalRecordPage } from "@/features/clinical-record/components/clinical-record-page"

interface ClinicalRecordRouteProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: ClinicalRecordRouteProps) {
  const { id } = await params
  const patientId = Number(id)

  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    notFound()
  }

  return <ClinicalRecordPage patientId={patientId} />
}
