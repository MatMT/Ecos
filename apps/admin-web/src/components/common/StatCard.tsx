import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type StatTrendTone = "negative" | "neutral" | "positive"

interface StatTrend {
  label: string
  tone: StatTrendTone
}

interface StatCardProps {
  description?: string
  icon?: LucideIcon
  isLoading?: boolean
  label: string
  trend?: StatTrend
  value: ReactNode
}

const trendStyles: Record<StatTrendTone, string> = {
  negative: "text-destructive",
  neutral: "text-muted-foreground",
  positive: "text-emerald-700 dark:text-emerald-300",
}

const trendIcons: Record<StatTrendTone, LucideIcon> = {
  negative: ArrowDownRight,
  neutral: Minus,
  positive: ArrowUpRight,
}

export function StatCard({
  description,
  icon: Icon,
  isLoading = false,
  label,
  trend,
  value,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  const TrendIcon = trend ? trendIcons[trend.tone] : null

  return (
    <Card className="shadow-sm">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mono mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </div>
          {Icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {trend && TrendIcon ? (
          <p className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${trendStyles[trend.tone]}`}>
            <TrendIcon aria-hidden="true" className="size-4" />
            {trend.label}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export type { StatTrend, StatTrendTone }
