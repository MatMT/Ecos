import { notFound } from "next/navigation";
import { ActivityAssignmentDetailPage } from "@/features/activity-assignments/components/activity-assignment-detail-page";

interface ActivityAssignmentDetailRouteProps {
  params: Promise<{ assignmentId: string; id: string }>;
}

export default async function Page({
  params,
}: ActivityAssignmentDetailRouteProps) {
  const { assignmentId, id } = await params;
  const patientId = Number(id);
  const activityAssignmentId = Number(assignmentId);

  if (
    !Number.isSafeInteger(patientId) ||
    patientId < 1 ||
    !Number.isSafeInteger(activityAssignmentId) ||
    activityAssignmentId < 1
  ) {
    notFound();
  }

  return (
    <ActivityAssignmentDetailPage
      assignmentId={activityAssignmentId}
      patientId={patientId}
    />
  );
}
