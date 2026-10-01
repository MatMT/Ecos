import { Skeleton } from "@/components/ui/skeleton"

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-4" aria-label="Verificando sesión">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  )
}
