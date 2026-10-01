import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("Ingrese una dirección de correo electrónico válida."),
  password: z.string().min(1, "Ingrese su contraseña."),
})
