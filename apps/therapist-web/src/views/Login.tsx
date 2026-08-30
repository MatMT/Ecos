'use client'

import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Activity } from 'lucide-react'

const Login: FC = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Simulate loading for UI
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      // En el futuro, aquí irá la lógica de redirección a /dashboard
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Panel Izquierdo: Ilustración */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy-950 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/login-illustration.jpg"
            alt="Ilustración de salud y terapia"
            className="h-full w-full object-cover opacity-60"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent z-10"></div>
        <div className="relative z-20 flex flex-col items-start px-16 max-w-xl text-white">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Activity size={20} />
            </div>
            <span className="text-xl font-bold font-display">Ecos Therapist</span>
          </div>
          <h2 className="text-4xl font-bold font-display leading-tight mb-4">
            Monitoreo biomédico avanzado para terapeutas.
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Accede a las métricas de tus pacientes en tiempo real, recibe alertas clínicas y mejora el seguimiento con insights basados en datos.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="flex items-center gap-2 mb-10 lg:hidden justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Activity size={20} />
            </div>
            <span className="text-xl font-bold font-display text-slate-800">Ecos Therapist</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold font-display text-slate-800 mb-2">
              Iniciar sesión
            </h1>
            <p className="text-slate-500">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Dirección de correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="doctor@clinica.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-teal-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            ¿No tienes una cuenta?{' '}
            <a href="#" className="font-medium text-teal-600 hover:text-teal-700">
              Contactar a soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

