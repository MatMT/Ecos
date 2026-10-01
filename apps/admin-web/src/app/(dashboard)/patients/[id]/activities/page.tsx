import { notFound } from "next/navigation";
import { PatientActivitiesPage } from "@/features/activity-assignments/components/patient-activities-page";

interface PatientActivitiesRouteProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PatientActivitiesRouteProps) {
  const { id } = await params;
  const patientId = Number(id);

  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    notFound();
  }

  return <PatientActivitiesPage patientId={patientId} />;
}
