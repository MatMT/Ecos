"use client"

import type { Key, ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/EmptyState"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

type DataTableAlignment = "center" | "left" | "right"

interface DataTableColumn<Row> {
  align?: DataTableAlignment
  cell: (row: Row) => ReactNode
  header: ReactNode
  id: string
}

interface DataTablePagination {
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  page: number
  pageSize: number
  pageSizeOptions?: readonly number[]
  total: number
}

interface DataTableProps<Row> {
  columns: readonly DataTableColumn<Row>[]
  data: readonly Row[]
  emptyState?: ReactNode
  getRowId: (row: Row) => Key
  isLoading?: boolean
  pagination?: DataTablePagination
  rowActions?: (row: Row) => ReactNode
}

export function DataTable<Row>({
  columns,
  data,
  emptyState,
  getRowId,
  isLoading = false,
  pagination,
  rowActions,
}: DataTableProps<Row>) {
  const columnCount = columns.length + (rowActions ? 1 : 0)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground ${getAlignmentClassName(column.align)}`}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
              {rowActions ? (
                <th
                  className="w-px px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground"
                  scope="col"
                >
                  Acciones
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <DataTableLoadingRows columnCount={columnCount} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columnCount}>
                  {emptyState ?? (
                    <EmptyState
                      description="No hay información disponible para mostrar."
                      title="No se encontraron resultados"
                    />
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={getRowId(row)} className="transition-colors hover:bg-muted/50">
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-4 py-3 align-middle text-foreground ${getAlignmentClassName(column.align)}`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-4 py-3 text-right align-middle">
                      {rowActions(row)}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination ? <DataTablePaginationControls pagination={pagination} /> : null}
    </div>
  )
}

function DataTableLoadingRows({ columnCount }: { columnCount: number }) {
  return Array.from({ length: 5 }, (_, rowIndex) => (
    <tr key={rowIndex}>
      {Array.from({ length: columnCount }, (_, columnIndex) => (
        <td key={columnIndex} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-32" />
        </td>
      ))}
    </tr>
  ))
}

function DataTablePaginationControls({
  pagination,
}: {
  pagination: DataTablePagination
}) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  const isFirstPage = pagination.page <= 1
  const isLastPage = pagination.page >= totalPages

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        {pagination.total === 0
          ? "Sin resultados"
          : `${pagination.total} resultado${pagination.total === 1 ? "" : "s"}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {pagination.pageSizeOptions && pagination.onPageSizeChange ? (
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => pagination.onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger aria-label="Resultados por página" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pagination.pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <span aria-live="polite" className="text-sm">
          Página {Math.min(pagination.page, totalPages)} de {totalPages}
        </span>
        <Button
          aria-label="Página anterior"
          disabled={isFirstPage}
          size="icon-sm"
          type="button"
          variant="outline"
          onClick={() => pagination.onPageChange(pagination.page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          aria-label="Página siguiente"
          disabled={isLastPage}
          size="icon-sm"
          type="button"
          variant="outline"
          onClick={() => pagination.onPageChange(pagination.page + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

function getAlignmentClassName(alignment: DataTableAlignment = "left"): string {
  if (alignment === "center") {
    return "text-center"
  }

  if (alignment === "right") {
    return "text-right"
  }

  return "text-left"
}

export type {
  DataTableAlignment,
  DataTableColumn,
  DataTablePagination,
  DataTableProps,
}
