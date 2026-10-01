"use client"

import { LogOut, UserRound } from "lucide-react"
import { DropdownMenu } from "radix-ui"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/features/auth/hooks/use-logout"
import type { AuthenticatedUser } from "@/features/auth/types/auth.types"

interface UserMenuProps {
  user: AuthenticatedUser
}

export function UserMenu({ user }: UserMenuProps) {
  const logout = useLogout()
  const displayName = user.fullName ?? user.email ?? "Usuario"

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          aria-label="Abrir menú de cuenta"
          className="max-w-48 justify-start"
          size="lg"
          type="button"
          variant="ghost"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate text-sm font-medium">{displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {getRoleLabel(user.role)}
            </span>
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 w-64 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-sm outline-none"
          sideOffset={8}
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {getRoleLabel(user.role)}
            </p>
            {user.email ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            ) : null}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive outline-none transition-colors data-highlighted:bg-destructive/10"
              disabled={logout.isPending}
              type="button"
              onClick={() => logout.mutate()}
            >
              <LogOut aria-hidden="true" className="size-4" />
              {logout.isPending ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function getRoleLabel(role: AuthenticatedUser["role"]): string {
  if (role === "administrator") {
    return "Administrador"
  }

  if (role === "psychologist") {
    return "Terapeuta"
  }

  return "Usuario"
}
