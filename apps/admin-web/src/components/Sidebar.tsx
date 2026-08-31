'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { FC } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Activity,
  ChevronRight,
} from 'lucide-react'

interface SidebarProps {
  notificationCount?: number
}

const navItems = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', href: '/patients', label: 'Usuarios', icon: Users },
]

const Sidebar: FC<SidebarProps> = ({ notificationCount = 0 }) => {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col md:flex"
      style={{ background: 'linear-gradient(180deg, #0b2033 0%, #0f2d47 100%)' }}
    >
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1a7dbf, #2d96dc)' }}
          >
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <p
              className="text-sm font-bold leading-tight text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Ecos Admin
            </p>
            <p className="text-xs text-white/40">Panel de Administracion</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=48&h=48&fit=crop&auto=format"
            alt="Dr. Carlos Mendez"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-400/40"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">Admin</p>
            <p className="text-xs text-white/40">Administrador</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white/30">
          Principal
        </p>
        {navItems.map(({ id, href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (id === 'patients' && pathname.startsWith('/patients/'))

          return (
            <Link
              key={id}
              href={href}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
              style={{
                background: isActive ? 'rgba(26,125,191,0.25)' : 'transparent',
                color: isActive ? '#5ab3e8' : 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon size={17} />
              <span className="flex-1 text-left font-medium">{label}</span>
              {isActive && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          )
        })}

        {/* <div className="pt-4">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white/30">
            Sistema
          </p>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Bell size={17} />
            <span className="flex-1 text-left font-medium">Notificaciones</span>
            {notificationCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Settings size={17} />
            <span className="flex-1 text-left font-medium">Configuración</span>
          </button>
        </div> */}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.40)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut size={17} />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
