"use client"

import { ErrorState } from "@/components/common/ErrorState"

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  void error

  return (
    <ErrorState
      description="Ha ocurrido un problema inesperado al mostrar esta sección. Por favor, intente nuevamente."
      onRetry={reset}
      retryLabel="Intentar nuevamente"
      title="No fue posible mostrar esta sección"
    />
  )
}
