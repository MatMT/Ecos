"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthLoading } from "@/features/auth/components/AuthLoading"
import { useAuthSessionLifecycle } from "@/features/auth/components/AuthSessionProvider"
import { useSession } from "@/features/auth/hooks/use-session"

export function AuthBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { endSession } = useAuthSessionLifecycle()
  const session = useSession()

  useEffect(() => {
    if (!session.isPending && session.isUnauthenticated) {
      endSession({ reason: "unauthenticated", returnTo: pathname })
    }
  }, [endSession, pathname, session.isPending, session.isUnauthenticated])

  if (session.isPending || session.isUnauthenticated) {
    return <AuthLoading />
  }

  if (session.isError) {
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

  return children
}
