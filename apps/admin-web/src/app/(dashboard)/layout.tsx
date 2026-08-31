import type { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar notificationCount={1} />
      <main className="min-h-screen flex-1 overflow-y-auto md:ml-64">
        {children}
      </main>
    </div>
  )
}

