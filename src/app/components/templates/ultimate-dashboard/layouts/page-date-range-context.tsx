import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useSearchParams } from "react-router-dom"

import { type DateRange } from "react-day-picker"

import type { DateFilters } from "@/lib/api"

export type DateRangeKey = "30d" | "month" | "mom" | "quarter" | "ytd" | "yoy" | "90d"

export const DEFAULT_DATE_RANGE_KEY: DateRangeKey = "90d"

const PRESET_KEYS: DateRangeKey[] = ["30d", "month", "mom", "quarter", "ytd", "yoy", "90d"]

export type PageDateRangeState = {
  today: Date
  preset: DateRangeKey | "custom"
  range: DateRange
  /** Always-complete ISO filters for API requests. */
  filters: DateFilters
  month: Date
  handleMonthChange: (next: Date) => void
  applyPreset: (key: DateRangeKey) => void
  selectRange: (next?: DateRange) => void
}

const PageDateRangeContext = createContext<PageDateRangeState | null>(null)

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function rangeFor(key: DateRangeKey, today = new Date()): DateRange {
  const to = startOfDay(today)

  if (key === "month") {
    return { from: new Date(to.getFullYear(), to.getMonth(), 1), to }
  }
  if (key === "mom") {
    // Prior full calendar month (MoM window).
    const from = new Date(to.getFullYear(), to.getMonth() - 1, 1)
    const end = new Date(to.getFullYear(), to.getMonth(), 0)
    return { from, to: end }
  }
  if (key === "quarter") {
    const quarterStart = Math.floor(to.getMonth() / 3) * 3
    return { from: new Date(to.getFullYear(), quarterStart, 1), to }
  }
  if (key === "ytd") {
    return { from: new Date(to.getFullYear(), 0, 1), to }
  }
  if (key === "yoy") {
    // Prior year-to-date through the same calendar day last year (YoY window).
    const from = new Date(to.getFullYear() - 1, 0, 1)
    const end = new Date(to.getFullYear() - 1, to.getMonth(), to.getDate())
    return { from, to: end }
  }

  const days = key === "30d" ? 29 : 89
  const from = new Date(to)
  from.setDate(to.getDate() - days)
  return { from, to }
}

export function formatRangeDate(date?: Date) {
  if (!date) return "End date"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatRangeShort(date?: Date) {
  if (!date) return ""
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function toIsoDate(date: Date) {
  const local = startOfDay(date)
  const year = local.getFullYear()
  const month = String(local.getMonth() + 1).padStart(2, "0")
  const day = String(local.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = startOfDay(new Date(year, month - 1, day))
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function eachDay(from: Date, to: Date) {
  const days: Date[] = []
  const cursor = startOfDay(from)
  const end = startOfDay(to)

  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function previousPeriod(range: DateRange) {
  if (!range.from) return null

  const from = startOfDay(range.from)
  const to = startOfDay(range.to ?? range.from)
  const length = Math.round((to.getTime() - from.getTime()) / 86400000) + 1
  const prevTo = new Date(from)
  prevTo.setDate(from.getDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setDate(prevTo.getDate() - length + 1)

  return { from: prevFrom, to: prevTo }
}

export function isDateRangeKey(value: string | null | undefined): value is DateRangeKey {
  return PRESET_KEYS.includes(value as DateRangeKey)
}

function filtersFromRange(range: DateRange): DateFilters | null {
  if (!range.from || !range.to) return null
  return {
    from: toIsoDate(startOfDay(range.from)),
    to: toIsoDate(startOfDay(range.to)),
  }
}

function parseStateFromSearch(
  searchParams: URLSearchParams,
  today: Date
): { preset: DateRangeKey | "custom"; range: DateRange } {
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  if (fromParam && toParam) {
    const from = parseIsoDate(fromParam)
    const to = parseIsoDate(toParam)
    if (from && to && from.getTime() <= to.getTime()) {
      return { preset: "custom", range: { from, to } }
    }
  }

  const presetParam = searchParams.get("preset")
  if (isDateRangeKey(presetParam)) {
    return { preset: presetParam, range: rangeFor(presetParam, today) }
  }

  return {
    preset: DEFAULT_DATE_RANGE_KEY,
    range: rangeFor(DEFAULT_DATE_RANGE_KEY, today),
  }
}

function buildDateSearchParams(
  preset: DateRangeKey | "custom",
  range: DateRange
): URLSearchParams {
  const params = new URLSearchParams()
  if (preset !== "custom" && isDateRangeKey(preset)) {
    params.set("preset", preset)
    return params
  }

  const filters = filtersFromRange(range)
  if (filters?.from && filters?.to) {
    params.set("from", filters.from)
    params.set("to", filters.to)
    return params
  }

  params.set("preset", DEFAULT_DATE_RANGE_KEY)
  return params
}

function searchParamsEqual(a: URLSearchParams, b: URLSearchParams) {
  return a.toString() === b.toString()
}

export function usePageDateRangeState(): PageDateRangeState {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [searchParams, setSearchParams] = useSearchParams()
  const skipNextUrlHydration = useRef(false)

  const initial = useMemo(
    () => parseStateFromSearch(searchParams, today),
    // Only hydrate once from the initial URL; later changes sync via effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [preset, setPreset] = useState<DateRangeKey | "custom">(initial.preset)
  const [range, setRange] = useState<DateRange>(initial.range)
  const [month, setMonth] = useState<Date>(() => initial.range.from ?? today)
  const [filters, setFilters] = useState<DateFilters>(() => {
    return (
      filtersFromRange(initial.range) ?? {
        from: toIsoDate(rangeFor(DEFAULT_DATE_RANGE_KEY, today).from!),
        to: toIsoDate(rangeFor(DEFAULT_DATE_RANGE_KEY, today).to!),
      }
    )
  })

  const commitCompleteRange = useCallback((next: DateRange) => {
    const nextFilters = filtersFromRange(next)
    if (!nextFilters) return
    setFilters(nextFilters)
  }, [])

  const handleMonthChange = useCallback((next: Date) => {
    setMonth((current) =>
      current.getFullYear() === next.getFullYear() && current.getMonth() === next.getMonth()
        ? current
        : next
    )
  }, [])

  const applyPreset = useCallback(
    (key: DateRangeKey) => {
      const next = rangeFor(key, today)
      skipNextUrlHydration.current = true
      setPreset(key)
      setRange(next)
      setMonth(next.from ?? today)
      commitCompleteRange(next)
    },
    [today, commitCompleteRange]
  )

  const selectRange = useCallback(
    (next?: DateRange) => {
      if (!next?.from) return
      skipNextUrlHydration.current = true
      setPreset("custom")
      const nextRange = {
        from: next.from,
        to: next.to,
      }
      setRange(nextRange)
      if (nextRange.from && nextRange.to) {
        commitCompleteRange(nextRange)
      }
    },
    [commitCompleteRange]
  )

  // Write committed period to the URL (and seed default params when missing).
  useEffect(() => {
    const complete =
      preset !== "custom"
        ? { preset, range: rangeFor(preset, today) }
        : range.from && range.to
          ? { preset, range }
          : null

    if (!complete) return

    const nextParams = buildDateSearchParams(complete.preset, complete.range)
    if (searchParamsEqual(nextParams, searchParams)) return

    skipNextUrlHydration.current = true
    setSearchParams(nextParams, { replace: true })
  }, [preset, range, today, searchParams, setSearchParams])

  // Hydrate from URL when search params change externally (back/forward, shared link).
  useEffect(() => {
    if (skipNextUrlHydration.current) {
      skipNextUrlHydration.current = false
      return
    }

    const parsed = parseStateFromSearch(searchParams, today)
    const nextFilters = filtersFromRange(parsed.range)
    if (!nextFilters) return

    setPreset(parsed.preset)
    setRange(parsed.range)
    setMonth(parsed.range.from ?? today)
    setFilters(nextFilters)
  }, [searchParams, today])

  return useMemo(
    () => ({
      today,
      preset,
      range,
      filters,
      month,
      handleMonthChange,
      applyPreset,
      selectRange,
    }),
    [today, preset, range, filters, month, handleMonthChange, applyPreset, selectRange]
  )
}

export function PageDateRangeProvider({ children }: { children: ReactNode }) {
  const value = usePageDateRangeState()
  return <PageDateRangeContext.Provider value={value}>{children}</PageDateRangeContext.Provider>
}

export function useOptionalPageDateRange() {
  return useContext(PageDateRangeContext)
}

export function usePageDateRange() {
  const context = useContext(PageDateRangeContext)
  if (!context) {
    throw new Error("usePageDateRange must be used within PageDateRangeProvider")
  }
  return context
}
