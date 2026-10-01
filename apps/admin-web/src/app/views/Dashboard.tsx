"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useSession } from "@/features/auth/hooks/use-session"

export default function Dashboard() {
  const session = useSession()
  const displayName = session.data?.fullName ?? session.data?.email ?? ""

  return (
    <Card className="max-w-2xl shadow-sm">
      <CardHeader>
        <h1 className="font-display text-2xl font-semibold">
          {displayName ? `Bienvenido, ${displayName}` : "Bienvenido a ECOS"}
        </h1>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Este espacio centralizará las herramientas de gestión y seguimiento
          disponibles según sus permisos.
        </p>
      </CardContent>
    </Card>
  )
}
