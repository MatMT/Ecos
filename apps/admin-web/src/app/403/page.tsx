"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { useLogout } from "@/features/auth/hooks/use-logout"

export default function ForbiddenPage() {
  const logout = useLogout()

  return (
    <ForbiddenState
      actions={
        <>
          <Button asChild type="button">
            <Link href="/dashboard">Volver al dashboard</Link>
          </Button>
          <Button
            disabled={logout.isPending}
            type="button"
            variant="outline"
            onClick={() => logout.mutate()}
          >
            {logout.isPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </Button>
        </>
      }
    />
  )
}
