import { z } from 'zod';

export const UserResponseSchema = z.object({
  id: z.string(),
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  role: z.string().nullable(),
});

export const TherapistResponseSchema = z.object({
  id: z.number(),
  userId: z.string(),
  professionalLicense: z.string().nullable(),
  specialty: z.string().nullable(),
  phone: z.string().nullable(),
  defaultSessionMinutes: z.number(),
  active: z.boolean(),
  user: UserResponseSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TherapistResponse = z.infer<typeof TherapistResponseSchema>;

export const CreateTherapistSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  professionalLicense: z.string().optional(),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  defaultSessionMinutes: z.coerce.number().min(1),
});

export type CreateTherapistDto = z.infer<typeof CreateTherapistSchema>;

export const UpdateTherapistSchema = z.object({
  professionalLicense: z.string().optional(),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  defaultSessionMinutes: z.coerce.number().min(1).optional(),
  active: z.boolean().optional(),
});

export type UpdateTherapistDto = z.infer<typeof UpdateTherapistSchema>;
