"use client"

import { useState, useMemo } from "react"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useTherapists } from "@/features/therapists/hooks/use-therapists"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { FilterBar } from "@/components/common/FilterBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PatientAssignmentHistoryModal } from "./PatientAssignmentHistoryModal"

type CombinedPatientItem = {
  id: number
  name: string
  email: string
  studentCode: string
  diagnosis: string
  therapistId: string | null
  therapistName: string
  therapistSpecialty: string
  rawPatient: any
}

export function AssignmentsManager() {
  const [searchPatient, setSearchPatient] = useState("")
  const [filterTherapistId, setFilterTherapistId] = useState("all")
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)

  const { data: patients, isLoading: isLoadingPatients } = usePatients({ skip: 0, take: 100 })
  const { data: therapists, isLoading: isLoadingTherapists } = useTherapists(0, 100)

  // Join patients with therapists
  const combinedData: CombinedPatientItem[] = useMemo(() => {
    if (!patients) return []
    
    return patients.map(patient => {
      const therapist = patient.assignedDoctorId 
        ? therapists?.find(t => t.userId === patient.assignedDoctorId) 
        : null

      return {
        id: patient.id,
        name: patient.user.fullName || "Sin nombre",
        email: patient.user.email || "",
        studentCode: patient.studentCode || "-",
        diagnosis: patient.primaryDiagnosis || "No especificado",
        therapistId: patient.assignedDoctorId,
        therapistName: therapist ? (therapist.user.fullName || therapist.user.email || "") : "Sin asignar",
        therapistSpecialty: therapist?.specialty || "",
        rawPatient: patient
      }
    })
  }, [patients, therapists])

  // Filter combined data
  const filteredData = useMemo(() => {
    return combinedData.filter(item => {
      const matchPatient = item.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
                           item.studentCode.toLowerCase().includes(searchPatient.toLowerCase()) ||
                           item.email.toLowerCase().includes(searchPatient.toLowerCase())
      
      const matchTherapist = filterTherapistId === "all" || 
                             (filterTherapistId === "unassigned" && !item.therapistId) ||
                             item.therapistId === filterTherapistId

      return matchPatient && matchTherapist
    })
  }, [combinedData, searchPatient, filterTherapistId])

  const columns: DataTableColumn<CombinedPatientItem>[] = [
    {
      id: "patient",
      header: "Paciente",
      cell: (row) => (
        <div>
          <p className="font-medium text-primary cursor-pointer hover:underline" onClick={() => setSelectedPatientId(row.id)}>
            {row.name}
          </p>
          <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{row.email}</span>
            {row.studentCode !== "-" && <span>• {row.studentCode}</span>}
          </div>
        </div>
      ),
    },
    {
      id: "diagnosis",
      header: "Diagnóstico",
      cell: (row) => <span className="text-sm">{row.diagnosis}</span>,
    },
    {
      id: "therapist",
      header: "Terapeuta Asignado",
      cell: (row) => (
        <div>
          {row.therapistId ? (
            <>
              <p className="font-medium text-sm">{row.therapistName}</p>
              {row.therapistSpecialty && <p className="text-xs text-muted-foreground">{row.therapistSpecialty}</p>}
            </>
          ) : (
            <span className="text-sm italic text-muted-foreground">Sin asignar</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setSelectedPatientId(row.id)}>
            Gestionar Asignación
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <FilterBar>
        <Input
          placeholder="Buscar paciente o matrícula..."
          value={searchPatient}
          onChange={(e) => setSearchPatient(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterTherapistId} onValueChange={setFilterTherapistId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={isLoadingTherapists ? "Cargando terapeutas..." : "Filtrar por terapeuta"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los terapeutas</SelectItem>
            <SelectItem value="unassigned">Sin asignar</SelectItem>
            {therapists?.map(t => (
              <SelectItem key={t.userId} value={t.userId}>
                {t.user.fullName || t.user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={filteredData}
          getRowId={(row) => row.id}
          isLoading={isLoadingPatients || isLoadingTherapists}
          emptyState={
            <div className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron pacientes con esos filtros.
            </div>
          }
        />
      </div>

      <PatientAssignmentHistoryModal
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        therapists={therapists || []}
      />
    </div>
  )
}
