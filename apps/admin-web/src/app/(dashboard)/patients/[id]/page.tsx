import PatientDetail from '@/app/views/PatientDetail'

interface PatientPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PatientPage({ params }: PatientPageProps) {
  const { id } = await params

  return <PatientDetail patientId={id} />
}
