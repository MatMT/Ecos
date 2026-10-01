import { z } from "zod"

const optionalCodeSchema = z.string().trim()

export const createPatientFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingrese el correo electrónico.")
    .email("Ingrese un correo electrónico válido."),
  fullName: z.string().trim().min(1, "Ingrese el nombre completo."),
  password: z
    .string()
    .min(6, "La contraseña debe contener al menos 6 caracteres."),
  studentCode: optionalCodeSchema,
})

export const updatePatientFormSchema = z.object({
  email: z.string(),
  fullName: z.string(),
  password: z.string(),
  studentCode: optionalCodeSchema,
})
