"use client"

import type { LucideIcon } from "lucide-react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ErrorStateProps {
  description: string
  icon?: LucideIcon
  onRetry?: () => void
  retryLabel?: string
  title: string
  variant?: "compact" | "full"
}

export function ErrorState({
  description,
  icon: Icon = AlertCircle,
  onRetry,
  retryLabel = "Reintentar",
  title,
  variant = "full",
}: ErrorStateProps) {
  return (
    <section
      className={`flex flex-col items-center justify-center text-center ${
        variant === "full" ? "px-4 py-10" : "px-4 py-6"
      }`}
      role="alert"
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 font-display text-base font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-4" type="button" variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          {retryLabel}
        </Button>
      ) : null}
    </section>
  )
}
