import type { StatusBadgeTone } from "@/components/common/StatusBadge";

interface AssignmentPresentation {
  label: string;
  tone: StatusBadgeTone;
}

const statusPresentations: Readonly<Record<string, AssignmentPresentation>> = {
  completed: { label: "Completada", tone: "success" },
  in_progress: { label: "En progreso", tone: "info" },
  pending: { label: "Pendiente", tone: "warning" },
};

const originPresentations: Readonly<Record<string, AssignmentPresentation>> = {
  ecos: { label: "ECOS", tone: "neutral" },
  psychologist: { label: "Terapeuta", tone: "info" },
};

export function getActivityAssignmentOriginPresentation(
  origin: string,
): AssignmentPresentation {
  return (
    originPresentations[origin] ?? {
      label: "Origen registrado",
      tone: "neutral",
    }
  );
}

export function getActivityAssignmentStatusPresentation(
  status: string,
): AssignmentPresentation {
  return (
    statusPresentations[status] ?? {
      label: "Estado registrado",
      tone: "neutral",
    }
  );
}
