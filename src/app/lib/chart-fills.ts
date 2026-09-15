/** CSS custom properties from `app-theme.css` chart scale. */
export const CHART_FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
  "var(--chart-11)",
  "var(--chart-12)",
] as const

export const CHART_FILL_OTHER = "var(--muted-foreground)"

export function chartFill(index: number): string {
  return CHART_FILLS[((index % CHART_FILLS.length) + CHART_FILLS.length) % CHART_FILLS.length]!
}

function hashLabel(label: string): number {
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Stable fill for a named slice; falls back to index when label is empty. */
export function chartFillForLabel(label: string, index: number): string {
  const key = label.trim().toLowerCase()
  if (!key) return chartFill(index)
  return chartFill(hashLabel(key))
}

/** Optional brand → color map for product tables. Unknown brands return undefined. */
const BRAND_COLORS: Record<string, string> = {
  belgard: "var(--chart-1)",
  "techobloc": "var(--chart-2)",
  "techo-bloc": "var(--chart-2)",
  "anchor": "var(--chart-3)",
  "ep henry": "var(--chart-4)",
  "eph": "var(--chart-4)",
  "oldcastle": "var(--chart-5)",
  "n/a": "var(--muted-foreground)",
}

export function productBrandColor(brand: string | null | undefined): string | undefined {
  if (!brand) return undefined
  const key = brand.trim().toLowerCase()
  if (!key) return undefined
  if (BRAND_COLORS[key]) return BRAND_COLORS[key]
  return chartFillForLabel(key, 0)
}
