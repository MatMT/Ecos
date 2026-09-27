"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthLoading } from "@/features/auth/components/AuthLoading"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { useSession } from "@/features/auth/hooks/use-session"
import { getSafeReturnTo } from "@/features/auth/return-to"

export function LoginRoute() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = useSession()
  const returnTo = searchParams.get("returnTo")

  useEffect(() => {
    if (session.isAuthenticated && session.hasPortalAccess) {
      router.replace(getSafeReturnTo(returnTo))
    }
  }, [returnTo, router, session.hasPortalAccess, session.isAuthenticated])

  useEffect(() => {
    if (session.isAuthenticated && !session.hasPortalAccess) {
      router.replace("/403")
    }
  }, [router, session.hasPortalAccess, session.isAuthenticated])

  if (session.isPending || session.isAuthenticated) {
    return <AuthLoading />
  }

  if (session.isError && !session.isUnauthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No fue posible verificar la sesión</CardTitle>
            <CardDescription>
              Ha ocurrido un problema temporal al comunicarse con el servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => void session.refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
          alt="Espacio de trabajo ECOS"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-zinc-900/40 mix-blend-multiply backdrop-brightness-75" />
        
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
              <Activity aria-hidden="true" size={24} />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">ECOS</span>
          </div>
          
          <div className="max-w-lg space-y-5">
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Plataforma administrativa de bienestar
            </h1>
            <p className="text-lg font-light text-white/90">
              Gestión eficiente, segura y enfocada en el cuidado de nuestros pacientes y profesionales.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center bg-card px-6 py-12 sm:px-12 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-[420px]">
          <LoginForm
            initialMessage={getInitialMessage(searchParams.get("reason"))}
            returnTo={returnTo}
          />
        </div>
      </div>
    </main>
  )
}

function getInitialMessage(reason: string | null): string | undefined {
  if (reason === "expired") {
    return "La sesión ha expirado. Inicie sesión nuevamente."
  }

  if (reason === "access-denied") {
    return "La cuenta no cuenta con acceso al portal administrativo."
  }

  return undefined
}
