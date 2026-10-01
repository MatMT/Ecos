import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EditActivityPage } from "@/features/activity-catalog/components/edit-activity-page";

export const metadata: Metadata = {
  title: "Editar actividad | ECOS",
};

interface EditActivityRouteProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: EditActivityRouteProps) {
  const { id } = await params;
  const activityId = Number(id);

  if (!Number.isSafeInteger(activityId) || activityId < 1) {
    notFound();
  }

  return <EditActivityPage activityId={activityId} />;
}
