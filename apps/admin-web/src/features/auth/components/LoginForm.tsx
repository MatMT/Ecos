"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Lock, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { ApiError } from "@/lib/api"
import { FormError } from "@/components/common/FormError"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/features/auth/hooks/use-login"
import { loginSchema } from "@/features/auth/schemas/login.schema"
import type { LoginInput } from "@/features/auth/types/auth.types"

interface LoginFormProps {
  initialMessage?: string
  returnTo: string | null
}

export function LoginForm({ initialMessage, returnTo }: LoginFormProps) {
  const login = useLogin(returnTo)
  const form = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  })

  const mutationMessage = getLoginErrorMessage(login.error)
  const message = mutationMessage ?? initialMessage

  return (
    <div className="w-full">
      <div className="mb-8 text-left">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Acceso al portal
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Ingrese sus credenciales institucionales para continuar.
        </p>
      </div>

      <form
        className="space-y-6"
        noValidate
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
      >
        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">
            Correo electrónico
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/70">
              <Mail className="size-5" strokeWidth={2} />
            </div>
            <Input
              id="email"
              autoComplete="email"
              disabled={login.isPending}
              inputMode="email"
              type="email"
              placeholder="ejemplo@ecos.edu"
              aria-invalid={Boolean(form.formState.errors.email)}
              className="h-12 w-full rounded-lg border-input bg-background pl-11 text-base shadow-sm transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Contraseña
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/70">
              <Lock className="size-5" strokeWidth={2} />
            </div>
            <Input
              id="password"
              autoComplete="current-password"
              disabled={login.isPending}
              type="password"
              placeholder="••••••••"
              aria-invalid={Boolean(form.formState.errors.password)}
              className="h-12 w-full rounded-lg border-input bg-background pl-11 text-base shadow-sm transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {message ? <FormError message={message} title="No fue posible acceder" /> : null}

        <Button
          className="h-12 w-full rounded-lg text-base font-semibold shadow-sm transition-all hover:shadow-md"
          disabled={login.isPending}
          type="submit"
          aria-busy={login.isPending}
        >
          {login.isPending ? "Verificando acceso…" : "Ingresar"}
        </Button>
      </form>
    </div>
  )
}

function getLoginErrorMessage(error: Error | null): string | undefined {
  if (!error) {
    return undefined
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Las credenciales proporcionadas no son válidas."
    }

    if (error.status === 0) {
      return "No fue posible comunicarse con el servidor. Por favor, intente nuevamente."
    }
  }

  return "Ha ocurrido un error durante el acceso. Por favor, intente nuevamente."
}
