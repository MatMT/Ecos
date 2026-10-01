import { Suspense } from "react"
import { AuthLoading } from "@/features/auth/components/AuthLoading"
import { LoginRoute } from "@/features/auth/components/LoginRoute"

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <LoginRoute />
    </Suspense>
  )
}
