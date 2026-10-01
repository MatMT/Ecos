"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { useAdministratorDashboard } from '../hooks/use-dashboard'
import { Users, UserCircle, Briefcase, Link2, Calendar, Watch, ChevronRight } from 'lucide-react'
import { useSession } from '@/features/auth/hooks/use-session'
import { Button } from '@/components/ui/button'

function getGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 12) return `Buenos días, ${name}`
  if (hour < 19) return `Buenas tardes, ${name}`
  return `Buenas noches, ${name}`
}

export function AdministratorDashboardView() {
  const query = useAdministratorDashboard()
  const session = useSession()
  const sessionData = session.data

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Error al cargar el dashboard"
        description="No fue posible cargar las métricas de la institución. Por favor, intente de nuevo."
        onRetry={() => query.refetch()}
      />
    )
  }

  const data = query.data
  const today = new Intl.DateTimeFormat('es', { dateStyle: 'full' }).format(new Date())
  const firstName = sessionData?.fullName?.split(' ')[0] || 'Administrador'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{getGreeting(firstName)}</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pacientes Activos" value={data.studentCount} icon={Users} color="text-blue-500" bgColor="bg-blue-100" borderColor="border-t-blue-500" link="/patients" />
        <StatCard title="Terapeutas" value={data.psychologistCount} icon={UserCircle} color="text-indigo-500" bgColor="bg-indigo-100" borderColor="border-t-indigo-500" link="/therapists" />
        <StatCard title="Administradores" value={data.administratorCount} icon={Briefcase} color="text-slate-500" bgColor="bg-slate-100" borderColor="border-t-slate-500" link="/users" />
        <StatCard title="Asignaciones Activas" value={data.activeAssignmentCount} icon={Link2} color="text-emerald-500" bgColor="bg-emerald-100" borderColor="border-t-emerald-500" link="/therapist-assignments" />
        <StatCard title="Citas de Hoy" value={data.todayAppointmentCount} icon={Calendar} color="text-amber-500" bgColor="bg-amber-100" borderColor="border-t-amber-500" link="/appointments" />
        <StatCard title="Dispositivos Vinculados" value={data.boundBandDeviceCount} icon={Watch} color="text-red-500" bgColor="bg-red-100" borderColor="border-t-red-500" link="/devices/bands" />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, bgColor, borderColor, link }: { title: string; value: number; icon: any; color: string; bgColor: string; borderColor: string; link: string }) {
  return (
    <Card className={`shadow-sm border-t-4 ${borderColor} relative group overflow-hidden`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-4">{value}</div>
        <Button asChild size="sm" variant="outline" className={`w-full bg-slate-50 hover:${bgColor} transition-colors border-dashed`}>
          <Link href={link}>Administrar <ChevronRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      </CardContent>
    </Card>
  )
}
