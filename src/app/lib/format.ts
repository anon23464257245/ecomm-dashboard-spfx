const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const currencyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const decimal = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
} as Intl.NumberFormatOptions)

export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return currency.format(0)
  return Math.abs(n) >= 1000 ? currency.format(n) : currencyPrecise.format(n)
}

export function formatCompactCurrency(
  value: number | null | undefined,
  maximumFractionDigits = 1
): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits,
    } as Intl.NumberFormatOptions).format(0)
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits,
  } as Intl.NumberFormatOptions).format(n)
}

export function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return "0"
  return number.format(n)
}

export function formatCompact(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return "0"
  return compact.format(n)
}

export function formatDecimal(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return "0"
  return decimal.format(n)
}

export function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return "0%"
  return `${decimal.format(n)}%`
}
