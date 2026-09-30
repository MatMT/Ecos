"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateAppointmentModal } from "./CreateAppointmentModal"

export function CreateAppointmentButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Nueva Cita
      </Button>
      
      <CreateAppointmentModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </>
  )
}
