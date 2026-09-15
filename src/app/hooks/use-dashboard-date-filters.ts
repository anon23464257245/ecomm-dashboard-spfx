import { useMemo } from "react"

import type { DateFilters } from "@/lib/api"
import {
  formatRangeShort,
  previousPeriod,
  startOfDay,
  usePageDateRange,
} from "@/components/templates/ultimate-dashboard/layouts/page-date-range-context"

export type DashboardDateFilters = {
  from: string
  to: string
  filters: DateFilters
  /** Human-readable current vs prior period label for chart descriptions. */
  comparisonLabel: string
}

/**
 * Normalized, always-complete period filters from the app-wide date range.
 * Incomplete custom calendar picks keep the last committed filters.
 */
export function useDashboardDateFilters(): DashboardDateFilters {
  const { filters } = usePageDateRange()
  const from = filters.from!
  const to = filters.to!

  const comparisonLabel = useMemo(() => {
    const currentFrom = startOfDay(new Date(`${from}T00:00:00`))
    const currentTo = startOfDay(new Date(`${to}T00:00:00`))
    const prior = previousPeriod({ from: currentFrom, to: currentTo })
    if (!prior) return "Selected period vs. the previous period"
    return `${formatRangeShort(currentFrom)} to ${formatRangeShort(currentTo)} vs. ${formatRangeShort(prior.from)} to ${formatRangeShort(prior.to)}`
  }, [from, to])

  return useMemo(
    () => ({
      from,
      to,
      filters: { from, to },
      comparisonLabel,
    }),
    [from, to, comparisonLabel]
  )
}
