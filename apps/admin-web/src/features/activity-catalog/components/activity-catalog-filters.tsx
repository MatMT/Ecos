"use client";

import { useEffect, useState } from "react";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActivityCatalogStateFilter } from "@/features/activity-catalog/types/activity-catalog.types";

interface ActivityCatalogFiltersProps {
  active: ActivityCatalogStateFilter;
  onActiveChange: (active: ActivityCatalogStateFilter) => void;
  onClear: () => void;
  onSearchChange: (search: string) => void;
  search: string;
}

export function ActivityCatalogFilters({
  active,
  onActiveChange,
  onClear,
  onSearchChange,
  search,
}: ActivityCatalogFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedSearch = searchInput.trim();
      if (normalizedSearch !== search) {
        onSearchChange(normalizedSearch);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [onSearchChange, search, searchInput]);

  return (
    <FilterBar
      actions={
        searchInput || active !== "all" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchInput("");
              onClear();
            }}
          >
            Limpiar filtros
          </Button>
        ) : undefined
      }
    >
      <Input
        aria-label="Buscar por título"
        className="min-w-48 flex-1"
        placeholder="Buscar por título"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
      />
      <Select value={active} onValueChange={onActiveChange}>
        <SelectTrigger
          aria-label="Estado de la actividad"
          className="w-full sm:w-48"
        >
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="active">Activas</SelectItem>
          <SelectItem value="inactive">Inactivas</SelectItem>
        </SelectContent>
      </Select>
    </FilterBar>
  );
}
