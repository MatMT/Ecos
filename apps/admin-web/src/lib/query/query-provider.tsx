"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { createQueryClient } from "@/lib/query/query-client"

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
