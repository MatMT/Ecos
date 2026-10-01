import type { ReactNode } from "react"
import { ShieldX } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ForbiddenStateProps {
  actions?: ReactNode
  description?: string
  title?: string
  variant?: "embedded" | "page"
}

export function ForbiddenState({
  actions,
  description = "No tiene permisos para acceder a esta sección.",
  title = "Acceso restringido",
  variant = "page",
}: ForbiddenStateProps) {
  const content = (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldX aria-hidden="true" size={22} />
        </div>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {actions ? (
        <CardContent className="flex flex-wrap justify-center gap-3">
          {actions}
        </CardContent>
      ) : null}
    </Card>
  )

  if (variant === "embedded") {
    return <section className="flex justify-center py-8">{content}</section>
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      {content}
    </main>
  )
}
