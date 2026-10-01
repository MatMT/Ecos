"use client";

import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActivityAssignmentStatusFilter } from "@/features/activity-assignments/types/activity-assignment.types";

interface ActivityAssignmentFiltersProps {
  onStatusChange: (status: ActivityAssignmentStatusFilter) => void;
  status: ActivityAssignmentStatusFilter;
}

export function ActivityAssignmentFilters({
  onStatusChange,
  status,
}: ActivityAssignmentFiltersProps) {
  return (
    <FilterBar
      actions={
        status !== "all" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onStatusChange("all")}
          >
            Limpiar filtros
          </Button>
        ) : undefined
      }
    >
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(toStatusFilter(value))}
      >
        <SelectTrigger
          aria-label="Estado de la actividad"
          className="w-full sm:w-52"
        >
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="pending">Pendientes</SelectItem>
          <SelectItem value="in_progress">En progreso</SelectItem>
          <SelectItem value="completed">Completadas</SelectItem>
        </SelectContent>
      </Select>
    </FilterBar>
  );
}

function toStatusFilter(value: string): ActivityAssignmentStatusFilter {
  if (value === "pending" || value === "in_progress" || value === "completed") {
    return value;
  }

  return "all";
}
