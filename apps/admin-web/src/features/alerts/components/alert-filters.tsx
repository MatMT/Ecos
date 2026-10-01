"use client"

import { Filter } from "lucide-react"
import { FilterBar } from "@/components/common/FilterBar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  AlertPriority,
  AlertStatus,
  AlertType,
} from "@/features/alerts/types/alert.types"
import {
  ALERT_PRIORITY_VALUES,
  ALERT_STATUS_VALUES,
  ALERT_TYPE_VALUES,
} from "@/features/alerts/types/alert.types"
import {
  formatAlertType,
  getAlertPriorityPresentation,
  getAlertStatusPresentation,
} from "@/features/alerts/utils/alert-formatters"

const ALL_FILTER_VALUE = "all"

interface AlertFiltersProps {
  alertType?: AlertType
  onChange: (filters: {
    alertType?: AlertType
    priority?: AlertPriority
    status?: AlertStatus
  }) => void
  onClear: () => void
  priority?: AlertPriority
  status?: AlertStatus
}

export function AlertFilters({
  alertType,
  onChange,
  onClear,
  priority,
  status,
}: AlertFiltersProps) {
  const hasFilters = Boolean(alertType || priority || status)

  return (
    <FilterBar
      actions={
        hasFilters ? (
          <Button onClick={onClear} type="button" variant="ghost">
            Limpiar filtros
          </Button>
        ) : null
      }
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter aria-hidden="true" className="size-4" />
        Filtros
      </div>
      <div className="grid min-w-40 gap-2">
        <Label htmlFor="alert-status-filter">Estado</Label>
        <Select
          value={status ?? ALL_FILTER_VALUE}
          onValueChange={(value) => onChange({
            alertType,
            priority,
            status: value === ALL_FILTER_VALUE ? undefined : value as AlertStatus,
          })}
        >
          <SelectTrigger id="alert-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>Todos los estados</SelectItem>
            {ALERT_STATUS_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {getAlertStatusPresentation(value).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid min-w-48 gap-2">
        <Label htmlFor="alert-type-filter">Tipo</Label>
        <Select
          value={alertType ?? ALL_FILTER_VALUE}
          onValueChange={(value) => onChange({
            alertType: value === ALL_FILTER_VALUE ? undefined : value as AlertType,
            priority,
            status,
          })}
        >
          <SelectTrigger id="alert-type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>Todos los tipos</SelectItem>
            {ALERT_TYPE_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {formatAlertType(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid min-w-44 gap-2">
        <Label htmlFor="alert-priority-filter">Prioridad</Label>
        <Select
          value={priority ?? ALL_FILTER_VALUE}
          onValueChange={(value) => onChange({
            alertType,
            priority: value === ALL_FILTER_VALUE ? undefined : value as AlertPriority,
            status,
          })}
        >
          <SelectTrigger id="alert-priority-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>Todas las prioridades</SelectItem>
            {ALERT_PRIORITY_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {getAlertPriorityPresentation(value)?.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FilterBar>
  )
}
