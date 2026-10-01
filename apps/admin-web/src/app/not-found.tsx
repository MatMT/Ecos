import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <h1 className="font-display text-xl font-semibold">Página no encontrada</h1>
          <CardDescription>
            La dirección solicitada no corresponde a una sección disponible de
            ECOS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
