"use client"

import { useSyncExternalStore } from "react"
import { Toaster } from "sonner"

type ToastTheme = "dark" | "light"

export function ToastProvider() {
  const theme = useSyncExternalStore<ToastTheme>(
    subscribeToTheme,
    getTheme,
    getServerTheme,
  )

  return (
    <Toaster
      closeButton
      position="top-right"
      richColors
      theme={theme}
      toastOptions={{ duration: 4_000 }}
    />
  )
}

function getTheme(): ToastTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function getServerTheme(): ToastTheme {
  return "light"
}

function subscribeToTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange)

  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true,
  })

  return () => observer.disconnect()
}
