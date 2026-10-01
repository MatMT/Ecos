"use client"

import { useCallback, useEffect, useMemo } from "react"
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation"
import { FileText } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { PaginationControls } from "@/components/common/DataTable"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/auth/hooks/use-session"
import { SessionTimeline } from "@/features/sessions/components/session-timeline"
import { usePatientSessions } from "@/features/sessions/hooks/use-patient-sessions"
import {
  DEFAULT_SESSIONS_PAGE,
  DEFAULT_SESSIONS_TAKE,
  SESSIONS_PAGE_SIZE_OPTIONS,
} from "@/features/sessions/types/session.types"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { usePatient } from "@/features/patients/hooks/use-patient"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import { ApiError } from "@/lib/api"

interface SessionsPageProps {
  patientId: number
}

export function SessionsPage({ patientId }: SessionsPageProps) {
  const session = useSession()
  const patientQuery = usePatient(patientId)

  if (session.isPending || patientQuery.isPending) {
    return <SessionsPageSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar el historial clínico. Por favor, intente nuevamente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar las sesiones"
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
        title="No fue posible cargar las sesiones"
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
      <PatientSessionsContent patientId={patientId} />
    </PatientWorkspace>
  )
}

function PatientSessionsContent({ patientId }: { patientId: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = getPositiveInteger(searchParams.get("page"), DEFAULT_SESSIONS_PAGE)
  const take = getPageSize(searchParams.get("take"))
  const listParams = useMemo(
    () => ({ skip: (page - 1) * take, take }),
    [page, take],
  )
  const sessionsQuery = usePatientSessions(patientId, listParams)

  const updatePagination = useCallback((nextPage: number, nextTake: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("page", String(nextPage))
    nextParams.set("take", String(nextTake))
    router.push(`${pathname}?${nextParams.toString()}`)
  }, [pathname, router, searchParams])

  const response = sessionsQuery.data
  const totalPages = Math.max(1, response?.meta?.totalPages ?? 1)
  const isPageOutOfRange = Boolean(response && (response.meta?.total ?? 0) > 0 && page > totalPages)

  useEffect(() => {
    if (isPageOutOfRange) {
      updatePagination(totalPages, take)
    }
  }, [isPageOutOfRange, take, totalPages, updatePagination])

  if (sessionsQuery.isPending) {
    return <SessionsContentSkeleton />
  }

  if (sessionsQuery.isError) {
    if (sessionsQuery.error instanceof ApiError) {
      if (sessionsQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (sessionsQuery.error.status === 404) {
        notFound()
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el historial de sesiones. Por favor, intente nuevamente."
        onRetry={() => void sessionsQuery.refetch()}
        title="No fue posible cargar las sesiones"
      />
    )
  }

  if (!response) {
    return <SessionsContentSkeleton />
  }

  if (isPageOutOfRange) {
    return <SessionsContentSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <PermissionGate permission="clinical-notes.manage">
            <Button onClick={() => router.push(patientRoutes.newSession(patientId))} type="button">
              Registrar sesión
            </Button>
          </PermissionGate>
        }
        description="Consulte las sesiones clínicas registradas en orden cronológico descendente."
        title="Sesiones"
      />
      {(response?.data || []).length === 0 ? (
        <Card>
          <EmptyState
            action={
              <PermissionGate permission="clinical-notes.manage">
                <Button onClick={() => router.push(patientRoutes.newSession(patientId))} type="button">
                  Registrar primera sesión
                </Button>
              </PermissionGate>
            }
            description="Todavía no hay sesiones registradas para este paciente."
            icon={FileText}
            title="Sin sesiones registradas"
          />
        </Card>
      ) : (
        <>
          <SessionTimeline
            patientId={patientId}
            sessions={response?.data || []}
            timeZone={response?.meta?.institutionTimezone || "America/El_Salvador"}
          />
          <PaginationControls
            pagination={{
              onPageChange: (nextPage) => updatePagination(nextPage, take),
              onPageSizeChange: (nextTake) => updatePagination(1, nextTake),
              page,
              pageSize: take,
              pageSizeOptions: SESSIONS_PAGE_SIZE_OPTIONS,
              total: response?.meta?.total ?? ((response?.data || []).length),
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
  const parsed = getPositiveInteger(value, DEFAULT_SESSIONS_TAKE)
  return SESSIONS_PAGE_SIZE_OPTIONS.includes(
    parsed as (typeof SESSIONS_PAGE_SIZE_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_SESSIONS_TAKE
}

function SessionsPageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-44 w-full" />
      <SessionsContentSkeleton />
    </div>
  )
}

function SessionsContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="h-8 w-32" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-36 w-full" key={index} />
      ))}
    </div>
  )
}

