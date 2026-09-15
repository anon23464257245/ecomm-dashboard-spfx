import { useCallback, useEffect, useState } from "react"
import type { DateFilters } from "@/lib/api"

type AsyncState<T> = {
  data: T | null
  error: string | null
  loading: boolean
  refetch: () => void
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => {
    setTick((value) => value + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loader()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  return { data, error, loading, refetch }
}

export function useDateFilters(defaults?: DateFilters) {
  const [from, setFrom] = useState(defaults?.from ?? "")
  const [to, setTo] = useState(defaults?.to ?? "")

  const filters: DateFilters = {
    from: from || undefined,
    to: to || undefined,
  }

  return { from, to, setFrom, setTo, filters }
}
