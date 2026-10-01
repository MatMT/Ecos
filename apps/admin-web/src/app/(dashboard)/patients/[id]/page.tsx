import { PatientOverviewView } from "@/features/patients/components/PatientOverviewView"
import { notFound } from "next/navigation"

interface PatientPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PatientPage({ params }: PatientPageProps) {
  const { id } = await params
  const studentId = Number(id)
  if (!Number.isSafeInteger(studentId) || studentId < 1) {
    notFound()
  }
  return <PatientOverviewView patientId={studentId} />
}
