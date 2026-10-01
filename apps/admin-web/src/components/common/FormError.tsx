import { AlertCircle } from "lucide-react"

interface FormErrorProps {
  message: string
  title?: string
}

export function FormError({
  message,
  title = "No fue posible completar la operación",
}: FormErrorProps) {
  return (
    <section
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1 text-sm">
        <p className="font-semibold">{title}</p>
        <p>{message}</p>
      </div>
    </section>
  )
}
