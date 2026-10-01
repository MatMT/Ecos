"use client"

import { useCallback, useEffect, useMemo } from "react"
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation"
import { HeartPulse } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { PaginationControls } from "@/components/common/DataTable"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/features/auth/hooks/use-session"
import { LatestBiometricMetrics } from "@/features/biometrics/components/latest-biometric-metrics"
import { BiometricTrends } from "@/features/biometrics/components/biometric-trends"
import { RecentBiometricHistory } from "@/features/biometrics/components/recent-biometric-history"
import { usePatientBiometrics } from "@/features/biometrics/hooks/use-patient-biometrics"
import {
  BIOMETRICS_PAGE_SIZE_OPTIONS,
  BIOMETRIC_RANGE_OPTIONS,
  type BiometricRange,
  DEFAULT_BIOMETRIC_RANGE,
  DEFAULT_BIOMETRICS_PAGE,
  DEFAULT_BIOMETRICS_TAKE,
} from "@/features/biometrics/types/biometric.types"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { usePatient } from "@/features/patients/hooks/use-patient"
import { ApiError } from "@/lib/api"

interface BiometricsPageProps {
  patientId: number
}

export function BiometricsPage({ patientId }: BiometricsPageProps) {
  const session = useSession()
  const patientQuery = usePatient(patientId)

  if (session.isPending || patientQuery.isPending) {
    return <BiometricsPageSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar los datos biométricos. Por favor, intente nuevamente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar la biometría"
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
        title="No fue posible cargar la biometría"
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
      <PatientBiometricsContent patientId={patientId} />
    </PatientWorkspace>
  )
}

function PatientBiometricsContent({ patientId }: { patientId: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = getPositiveInteger(searchParams.get("page"), DEFAULT_BIOMETRICS_PAGE)
  const take = getPageSize(searchParams.get("take"))
  const range = getBiometricRange(searchParams.get("range"))
  const listParams = useMemo(
    () => ({ range, skip: (page - 1) * take, take }),
    [page, range, take],
  )
  const biometricsQuery = usePatientBiometrics(patientId, listParams)

  const updatePagination = useCallback((nextPage: number, nextTake: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("range", range)
    nextParams.set("page", String(nextPage))
    nextParams.set("take", String(nextTake))
    router.push(`${pathname}?${nextParams.toString()}`)
  }, [pathname, range, router, searchParams])

  const updateRange = useCallback((nextRange: typeof range) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("range", nextRange)
    nextParams.set("page", String(DEFAULT_BIOMETRICS_PAGE))
    nextParams.set("take", String(take))
    router.push(`${pathname}?${nextParams.toString()}`)
  }, [pathname, router, searchParams, take])

  const response = biometricsQuery.data
  const totalPages = Math.max(1, response?.meta.totalPages ?? 1)
  const isPageOutOfRange = Boolean(response && response.meta.total > 0 && page > totalPages)

  useEffect(() => {
    if (isPageOutOfRange) {
      updatePagination(totalPages, take)
    }
  }, [isPageOutOfRange, take, totalPages, updatePagination])

  useEffect(() => {
    if (searchParams.get("range") !== range) {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("range", range)
      nextParams.set("page", String(DEFAULT_BIOMETRICS_PAGE))
      nextParams.set("take", String(take))
      router.replace(`${pathname}?${nextParams.toString()}`)
    }
  }, [pathname, range, router, searchParams, take])

  if (biometricsQuery.isPending) {
    return <BiometricsContentSkeleton />
  }

  if (biometricsQuery.isError) {
    if (biometricsQuery.error instanceof ApiError) {
      if (biometricsQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (biometricsQuery.error.status === 404) {
        notFound()
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar los datos biométricos sincronizados. Por favor, intente nuevamente."
        onRetry={() => void biometricsQuery.refetch()}
        title="No fue posible cargar la biometría"
      />
    )
  }

  if (!response || isPageOutOfRange) {
    return <BiometricsContentSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Consulte los datos biométricos sincronizados y los registros recientes del paciente."
        title="Biometría"
      />
      {response.latest ? (
        <LatestBiometricMetrics
          record={response.latest}
          timeZone={response.meta.institutionTimezone}
        />
      ) : null}
      <BiometricTrends
        onRangeChange={updateRange}
        patientId={patientId}
        range={range}
      />
      {response.data.length === 0 ? (
        <Card>
          <EmptyState
            description={
              response.latest
                ? "No hay datos biométricos sincronizados para el período seleccionado."
                : "No hay datos biométricos sincronizados para este paciente."
            }
            icon={HeartPulse}
            title="Sin registros biométricos"
          />
        </Card>
      ) : (
        <>
          <RecentBiometricHistory
            records={response.data}
            timeZone={response.meta.institutionTimezone}
          />
          <PaginationControls
            pagination={{
              onPageChange: (nextPage) => updatePagination(nextPage, take),
              onPageSizeChange: (nextTake) => updatePagination(1, nextTake),
              page,
              pageSize: take,
              pageSizeOptions: BIOMETRICS_PAGE_SIZE_OPTIONS,
              total: response.meta.total,
            }}
          />
        </>
      )}
    </div>
  )
}

function getBiometricRange(value: string | null): BiometricRange {
  return BIOMETRIC_RANGE_OPTIONS.includes(value as BiometricRange)
    ? (value as BiometricRange)
    : DEFAULT_BIOMETRIC_RANGE
}

function getPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function getPageSize(value: string | null): number {
  const parsed = getPositiveInteger(value, DEFAULT_BIOMETRICS_TAKE)
  return BIOMETRICS_PAGE_SIZE_OPTIONS.includes(
    parsed as (typeof BIOMETRICS_PAGE_SIZE_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_BIOMETRICS_TAKE
}

function BiometricsPageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-44 w-full" />
      <BiometricsContentSkeleton />
    </div>
  )
}

function BiometricsContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton className="h-36 w-full" key={index} />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
