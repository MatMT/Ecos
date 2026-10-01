import type { Metadata } from "next";
import { CreateActivityPage } from "@/features/activity-catalog/components/create-activity-page";

export const metadata: Metadata = {
  title: "Nueva actividad | ECOS",
};

export default function Page() {
  return <CreateActivityPage />;
}
