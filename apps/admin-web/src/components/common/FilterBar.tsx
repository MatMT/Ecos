import type { ReactNode } from "react"

interface FilterBarProps {
  actions?: ReactNode
  children: ReactNode
}

export function FilterBar({ actions, children }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
