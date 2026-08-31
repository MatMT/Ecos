import ClinicalNotes from '@/views/ClinicalNotes'

interface ClinicalNotesPageProps {
  searchParams?: Promise<{
    patientId?: string
  }>
}

export default async function ClinicalNotesPage({
  searchParams,
}: ClinicalNotesPageProps) {
  const params = await searchParams

  return <ClinicalNotes preselectedPatientId={params?.patientId} />
}
