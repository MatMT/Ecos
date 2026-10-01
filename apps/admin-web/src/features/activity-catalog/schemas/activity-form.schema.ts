import { z } from "zod";

export const activityFormSchema = z.object({
  description: z.string(),
  instructions: z.string(),
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio.")
    .max(255, "El título no puede exceder los 255 caracteres."),
});
