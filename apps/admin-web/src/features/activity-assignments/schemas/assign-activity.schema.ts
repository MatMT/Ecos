import { z } from "zod";

export const assignActivityFormSchema = z.object({
  activityId: z.string().trim().min(1, "Seleccione una actividad."),
  dueAt: z
    .string()
    .refine(
      (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
      "Ingrese una fecha y hora válidas.",
    ),
});
