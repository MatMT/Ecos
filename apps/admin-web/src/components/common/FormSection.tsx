import { useId, type ReactNode } from "react"

interface FormSectionProps {
  actions?: ReactNode
  children: ReactNode
  description?: string
  title: string
}

export function FormSection({
  actions,
  children,
  description,
  title,
}: FormSectionProps) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
