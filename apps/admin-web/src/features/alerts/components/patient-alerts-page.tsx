"use client"

import { useCallback, useEffect, useMemo } from "react"
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation"
import { TriangleAlert } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { PaginationControls } from "@/components/common/DataTable"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertFilters } from "@/features/alerts/components/alert-filters"
import { AlertTimeline } from "@/features/alerts/components/alert-timeline"
import { usePatientAlerts } from "@/features/alerts/hooks/use-patient-alerts"
import {
  ALERT_PRIORITY_VALUES,
  ALERT_STATUS_VALUES,
  ALERT_TYPE_VALUES,
  ALERTS_PAGE_SIZE_OPTIONS,
  DEFAULT_ALERTS_PAGE,
  DEFAULT_ALERTS_TAKE,
  type AlertPriority,
  type AlertStatus,
  type AlertType,
} from "@/features/alerts/types/alert.types"
import { useSession } from "@/features/auth/hooks/use-session"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { usePatient } from "@/features/patients/hooks/use-patient"
import { ApiError } from "@/lib/api"

interface PatientAlertsPageProps {
  patientId: number
}

interface AlertFiltersState {
  alertType?: AlertType
  priority?: AlertPriority
  status?: AlertStatus
}

export function PatientAlertsPage({ patientId }: PatientAlertsPageProps) {
  const session = useSession()
  const patientQuery = usePatient(patientId)

  if (session.isPending || patientQuery.isPending) {
    return <PatientAlertsPageSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar las alertas. Por favor, intente nuevamente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar las alertas"
      />
    )
  }

  if (!session.isAuthenticated || session.data?.role !== "psychologist") {
    return <ForbiddenState variant="embedded" />
  }

  if (patientQuery.isError) {
    if (patientQuery.error instanceof ApiError) {
      if (patientQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (patientQuery.error.status === 404) {
        notFound()
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el contexto del paciente. Por favor, intente nuevamente."
        onRetry={() => void patientQuery.refetch()}
        title="No fue posible cargar las alertas"
      />
    )
  }

  const patient = patientQuery.data
  const context: PatientWorkspaceContext = {
    email: patient.user.email,
    fullName: patient.user.fullName,
    patientId: patient.id,
    studentCode: patient.studentCode,
    therapist: patient.assignedDoctor ?? null,
  }

  return (
    <PatientWorkspace context={context} role={session.data.role}>
      <PatientAlertsContent patientId={patientId} />
    </PatientWorkspace>
  )
}

function PatientAlertsContent({ patientId }: { patientId: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = getPositiveInteger(searchParams.get("page"), DEFAULT_ALERTS_PAGE)
  const take = getPageSize(searchParams.get("take"))
  const filters = useMemo<AlertFiltersState>(() => ({
    alertType: getEnumValue(searchParams.get("alertType"), ALERT_TYPE_VALUES),
    priority: getEnumValue(searchParams.get("priority"), ALERT_PRIORITY_VALUES),
    status: getEnumValue(searchParams.get("status"), ALERT_STATUS_VALUES),
  }), [searchParams])
  const listParams = useMemo(
    () => ({ ...filters, skip: (page - 1) * take, take }),
    [filters, page, take],
  )
  const alertsQuery = usePatientAlerts(patientId, listParams)
  const hasInvalidFilters = hasInvalidFilterValues(searchParams)

  const updateSearchParams = useCallback((
    nextPage: number,
    nextTake: number,
    nextFilters: AlertFiltersState,
    replace = false,
  ) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("page", String(nextPage))
    nextParams.set("take", String(nextTake))
    setFilterParam(nextParams, "status", nextFilters.status)
    setFilterParam(nextParams, "alertType", nextFilters.alertType)
    setFilterParam(nextParams, "priority", nextFilters.priority)
    const href = `${pathname}?${nextParams.toString()}`
    if (replace) {
      router.replace(href)
      return
    }
    router.push(href)
  }, [pathname, router, searchParams])

  const response = alertsQuery.data
  const totalPages = Math.max(1, response?.meta.totalPages ?? 1)
  const isPageOutOfRange = Boolean(response && response.meta.total > 0 && page > totalPages)

  useEffect(() => {
    if (hasInvalidFilters) {
      updateSearchParams(DEFAULT_ALERTS_PAGE, take, filters, true)
    }
  }, [filters, hasInvalidFilters, take, updateSearchParams])

  useEffect(() => {
    if (isPageOutOfRange) {
      updateSearchParams(totalPages, take, filters, true)
    }
  }, [filters, isPageOutOfRange, take, totalPages, updateSearchParams])

  if (alertsQuery.isPending) {
    return <AlertsContentSkeleton />
  }

  if (alertsQuery.isError) {
    if (alertsQuery.error instanceof ApiError) {
      if (alertsQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (alertsQuery.error.status === 404) {
        notFound()
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el historial de alertas. Por favor, intente nuevamente."
        onRetry={() => void alertsQuery.refetch()}
        title="No fue posible cargar las alertas"
      />
    )
  }

  if (!response || isPageOutOfRange) {
    return <AlertsContentSkeleton />
  }

  const hasFilters = Boolean(filters.alertType || filters.priority || filters.status)

  return (
    <div className="space-y-6">
      <PageHeader
        description="Consulte las alertas persistidas asociadas al paciente y su estado de seguimiento."
        title="Alertas"
      />
      <AlertFilters
        {...filters}
        onChange={(nextFilters) =>
          updateSearchParams(DEFAULT_ALERTS_PAGE, take, nextFilters)
        }
        onClear={() => updateSearchParams(DEFAULT_ALERTS_PAGE, take, {})}
      />
      {response.data.length === 0 ? (
        <Card>
          <EmptyState
            action={
              hasFilters ? (
                <Button
                  onClick={() => updateSearchParams(DEFAULT_ALERTS_PAGE, take, {})}
                  type="button"
                  variant="outline"
                >
                  Limpiar filtros
                </Button>
              ) : undefined
            }
            description={
              hasFilters
                ? "No encontramos alertas con los filtros seleccionados."
                : "No hay alertas registradas para este paciente."
            }
            icon={TriangleAlert}
            title={hasFilters ? "Sin resultados" : "Sin alertas registradas"}
          />
        </Card>
      ) : (
        <>
          <AlertTimeline
            alerts={response.data}
            patientId={patientId}
            timeZone={response.meta.institutionTimezone}
          />
          <PaginationControls
            pagination={{
              onPageChange: (nextPage) =>
                updateSearchParams(nextPage, take, filters),
              onPageSizeChange: (nextTake) =>
                updateSearchParams(DEFAULT_ALERTS_PAGE, nextTake, filters),
              page,
              pageSize: take,
              pageSizeOptions: ALERTS_PAGE_SIZE_OPTIONS,
              total: response.meta.total,
            }}
          />
        </>
      )}
    </div>
  )
}

function getPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function getPageSize(value: string | null): number {
  const parsed = getPositiveInteger(value, DEFAULT_ALERTS_TAKE)
  return ALERTS_PAGE_SIZE_OPTIONS.includes(
    parsed as (typeof ALERTS_PAGE_SIZE_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_ALERTS_TAKE
}

function getEnumValue<Value extends string>(
  value: string | null,
  values: readonly Value[],
): Value | undefined {
  return value && values.includes(value as Value) ? value as Value : undefined
}

function hasInvalidFilterValues(searchParams: URLSearchParams): boolean {
  return isInvalidEnumValue(searchParams.get("status"), ALERT_STATUS_VALUES)
    || isInvalidEnumValue(searchParams.get("alertType"), ALERT_TYPE_VALUES)
    || isInvalidEnumValue(searchParams.get("priority"), ALERT_PRIORITY_VALUES)
}

function isInvalidEnumValue<Value extends string>(
  value: string | null,
  values: readonly Value[],
): boolean {
  return value !== null && !values.includes(value as Value)
}

function setFilterParam(
  params: URLSearchParams,
  key: "alertType" | "priority" | "status",
  value: string | undefined,
) {
  if (value) {
    params.set(key, value)
    return
  }
  params.delete(key)
}

function PatientAlertsPageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-44 w-full" />
      <AlertsContentSkeleton />
    </div>
  )
}

function AlertsContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-36 w-full" key={index} />
      ))}
    </div>
  )
}
