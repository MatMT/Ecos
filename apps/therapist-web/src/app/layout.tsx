import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ecos Therapist',
    'Monitorea y analiza datos biomédicos de pacientes para terapeutas con métricas, alertas e insights clínicos.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
