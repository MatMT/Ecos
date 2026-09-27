"use client"

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { getBreadcrumbDefinitions } from "@/lib/navigation"

type BreadcrumbLabels = Readonly<Record<string, string>>

interface DashboardBreadcrumbContextValue {
  labels: BreadcrumbLabels
  setLabel: (pathname: string, label: string | null) => void
}

const DashboardBreadcrumbContext =
  createContext<DashboardBreadcrumbContextValue | null>(null)

export function DashboardBreadcrumbProvider({
  children,
}: {
  children: ReactNode
}) {
  const [labels, setLabels] = useState<BreadcrumbLabels>({})

  const setLabel = useCallback((pathname: string, label: string | null) => {
    setLabels((currentLabels) => {
      if (label === null) {
        if (!(pathname in currentLabels)) {
          return currentLabels
        }

        const { [pathname]: removedLabel, ...remainingLabels } = currentLabels
        void removedLabel
        return remainingLabels
      }

      if (currentLabels[pathname] === label) {
        return currentLabels
      }

      return { ...currentLabels, [pathname]: label }
    })
  }, [])

  const contextValue = useMemo(
    () => ({ labels, setLabel }),
    [labels, setLabel],
  )

  return (
    <DashboardBreadcrumbContext.Provider value={contextValue}>
      {children}
    </DashboardBreadcrumbContext.Provider>
  )
}

export function useDashboardBreadcrumbLabel(
  label: string | null,
  targetPath?: string,
) {
  const context = useContext(DashboardBreadcrumbContext)
  const currentPathname = usePathname()
  const pathname = targetPath ?? currentPathname

  if (!context) {
    throw new Error(
      "useDashboardBreadcrumbLabel debe utilizarse dentro de DashboardBreadcrumbProvider.",
    )
  }

  const { setLabel } = context

  useEffect(() => {
    setLabel(pathname, label)

    return () => setLabel(pathname, null)
  }, [label, pathname, setLabel])
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const context = useContext(DashboardBreadcrumbContext)
  const breadcrumbs = getBreadcrumbDefinitions(pathname)

  return (
    <nav aria-label="Ruta de navegación" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {breadcrumbs.map((breadcrumb, index) => {
          const isCurrent = index === breadcrumbs.length - 1

          return (
            <li
              key={breadcrumb.path}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              ) : null}
              {breadcrumb.href && !isCurrent ? (
                <Link
                  className="truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={breadcrumb.href}
                >
                  {breadcrumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="truncate font-medium text-foreground"
                >
                  {isCurrent
                    ? context?.labels[pathname] ?? breadcrumb.label
                    : breadcrumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
