"use client"

import { useState } from "react"
import { useTherapists } from "../hooks/use-therapists"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { ErrorState } from "@/components/common/ErrorState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { FilterBar } from "@/components/common/FilterBar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import type { TherapistResponse } from "../dto/therapists.dto"

export function TherapistList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // For this initial version, pagination is done via skip/take
  // The API doesn't return a total count envelope currently, so we simulate a basic page
  const skip = (page - 1) * pageSize
  const { data, isLoading, error, refetch } = useTherapists(skip, pageSize)

  if (error) {
    return (
      <ErrorState
        title="Error al cargar"
        description="No pudimos cargar la lista de terapeutas."
        onRetry={() => refetch()}
      />
    )
  }

  // Frontend-side search and filtering since backend API might not support it yet without specific params
  const filteredData = (data ?? []).filter((therapist) => {
    const matchesSearch = therapist.user.fullName?.toLowerCase().includes(search.toLowerCase()) || 
                          therapist.user.email?.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === "active") return matchesSearch && therapist.active;
    if (statusFilter === "inactive") return matchesSearch && !therapist.active;
    return matchesSearch;
  })

  const columns: DataTableColumn<TherapistResponse>[] = [
    {
      id: "name",
      header: "Nombre",
      cell: (row) => (
        <Link href={`/therapists/${row.userId}`} className="block hover:underline">
          <p className="font-medium text-primary">{row.user.fullName || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </Link>
      ),
    },
    {
      id: "specialty",
      header: "Especialidad",
      cell: (row) => <span className="text-sm">{row.specialty || "General"}</span>,
    },
    {
      id: "license",
      header: "Cédula / Licencia",
      cell: (row) => <span className="text-sm">{row.professionalLicense || "-"}</span>,
    },
    {
      id: "status",
      header: "Estado",
      cell: (row) => (
        <StatusBadge
          tone={row.active ? "success" : "neutral"}
          label={row.active ? "Activo" : "Inactivo"}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <FilterBar>
        <Input
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>
      <DataTable
        columns={columns}
        data={filteredData}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize,
          total: data?.length === pageSize ? page * pageSize + 1 : skip + (data?.length || 0), // Basic heuristic
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
          pageSizeOptions: [10, 20, 50],
        }}
      />
    </div>
  )
}
