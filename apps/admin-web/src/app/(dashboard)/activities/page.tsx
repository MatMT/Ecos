import type { Metadata } from "next";
import { ActivityCatalogPage } from "@/features/activity-catalog/components/activity-catalog-page";

export const metadata: Metadata = {
  title: "Actividades terapéuticas | ECOS",
};

export default function Page() {
  return <ActivityCatalogPage />;
}
