"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormSection } from "@/components/common/FormSection"
import { FormError } from "@/components/common/FormError"
import { ApiError } from "@/lib/api/errors"
import { useCreateTherapist } from "../hooks/use-therapists"
import { CreateTherapistSchema, type CreateTherapistDto } from "../dto/therapists.dto"

export function TherapistCreateForm() {
  const router = useRouter()
  const createMutation = useCreateTherapist()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTherapistDto>({
    resolver: zodResolver(CreateTherapistSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      professionalLicense: "",
      specialty: "",
      phone: "",
      defaultSessionMinutes: 60,
    },
  })

  const onSubmit = (data: CreateTherapistDto) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Terapeuta creado exitosamente")
        router.push("/therapists")
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error("Error", { description: error.message })
        } else {
          toast.error("Ocurrió un error inesperado al crear el perfil.")
        }
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {createMutation.isError && createMutation.error instanceof ApiError ? (
        <FormError message={createMutation.error.message} />
      ) : null}

      <FormSection
        title="Información Personal y Credenciales"
        description="Datos requeridos para el acceso al sistema."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo *</Label>
            <Input id="fullName" {...register("fullName")} aria-invalid={!!errors.fullName} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="password">Contraseña Provisional *</Label>
            <Input id="password" type="password" {...register("password")} aria-invalid={!!errors.password} />
            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres. El terapeuta podrá cambiarla después.</p>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Información Profesional"
        description="Datos clínicos que se mostrarán a los pacientes."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidad Clínica</Label>
            <Input id="specialty" placeholder="ej. Psicología Clínica" {...register("specialty")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalLicense">Número de Licencia / JVPP</Label>
            <Input id="professionalLicense" {...register("professionalLicense")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono de Contacto</Label>
            <Input id="phone" type="tel" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultSessionMinutes">Duración de Sesión (minutos)</Label>
            <Input id="defaultSessionMinutes" type="number" {...register("defaultSessionMinutes")} />
            {errors.defaultSessionMinutes && <p className="text-sm text-destructive">{errors.defaultSessionMinutes.message}</p>}
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/therapists")}
          disabled={createMutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Guardando..." : "Crear Terapeuta"}
        </Button>
      </div>
    </form>
  )
}


