"use client"

import { useSession } from "@/features/auth/hooks/use-session"
import { AdministratorDashboardView } from "@/features/dashboard/components/AdministratorDashboardView"
import { PsychologistDashboardView } from "@/features/dashboard/components/PsychologistDashboardView"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/common/ErrorState"

export default function Dashboard() {
  const session = useSession()

  if (session.isPending) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (session.isError || !session.isAuthenticated || !session.data) {
    return (
      <ErrorState
        title="Sesión no válida"
        description="No fue posible validar su sesión para mostrar el dashboard."
        onRetry={() => session.refetch()}
      />
    )
  }

  if (session.data.role === 'administrator') {
    return <AdministratorDashboardView />
  }

  if (session.data.role === 'psychologist') {
    return <PsychologistDashboardView />
  }

  return (
    <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
      <p className="text-sm text-muted-foreground">Rol no soportado en este panel.</p>
    </div>
  )
}
