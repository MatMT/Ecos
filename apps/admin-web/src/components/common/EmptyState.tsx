import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  action?: ReactNode
  description: string
  icon?: LucideIcon
  title: string
}

export function EmptyState({
  action,
  description,
  icon: Icon = Inbox,
  title,
}: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h2 className="mt-4 font-display text-base font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  )
}
