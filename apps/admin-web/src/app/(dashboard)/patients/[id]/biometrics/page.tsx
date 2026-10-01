import { notFound } from "next/navigation"
import { BiometricsPage } from "@/features/biometrics/components/biometrics-page"

interface BiometricsRouteProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: BiometricsRouteProps) {
  const { id } = await params
  const patientId = Number(id)

  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    notFound()
  }

  return <BiometricsPage patientId={patientId} />
}
