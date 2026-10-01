import type { Metadata } from "next"
import type { ReactNode } from "react"
import Script from "next/script"
import { AuthSessionProvider } from "@/features/auth/components/AuthSessionProvider"
import { ToastProvider } from "@/components/common/ToastProvider"
import { QueryProvider } from "@/lib/query/query-provider"
import "./globals.css"

const themeInitializationScript = `
  try {
    const storedTheme = localStorage.getItem('ecos-admin-theme');
    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
`

export const metadata: Metadata = {
  title: "Ecos Admin",
  description: "Control.",
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
    <html lang="es" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </QueryProvider>
        <ToastProvider />
        <Script id="theme-initialization" strategy="beforeInteractive">
          {themeInitializationScript}
        </Script>
      </body>
    </html>
  )
}
