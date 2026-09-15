import { apiUrl } from "@/lib/api-config"

export type DateFilters = {
  from?: string
  to?: string
}

export type Comparison = {
  current: number
  previous: number
  change?: number
  percentChange: number
}

export type NamedMixSlice = {
  label: string
  value: number
  children?: Array<{ label: string; value: number }>
}

export type ScoreboardDashboard = {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  activeCustomers: number
  revenuePerCustomer: number
  newCustomers: number
  totalCompanies: number
  onboarded: number
  trainingPending: number
  trainingComplete: number
  revenueComparison: Comparison
  ordersComparison: Comparison
  aovComparison: Comparison
  activeCustomersComparison: Comparison
  revenuePerCustomerComparison: Comparison
  newCustomersComparison: Comparison
  onboardedComparison: Comparison
  trainingPendingComparison: Comparison
  trainingCompleteComparison: Comparison
  dailyPerformance: Array<{
    date: string
    currentRevenue: number
    previousRevenue: number
    currentOrders: number
    previousOrders: number
  }>
  topCustomers: Array<{
    company_id: number | string
    company_name: string
    division?: string
    orderCount: number
    revenue: number
  }>
  topProducts: Array<{
    product_id: number | string
    product_name: string
    sku?: string
    brand?: string
    unitsSold: number
    revenue: number
  }>
  concentration: Array<{ label: string; value: number }>
  rankedBuyers: Array<{
    company_id: number | string
    company_name: string
    revenue: number
  }>
}

export type CustomerDashboard = {
  summary: {
    medianDaysSinceLastOrder: number
    newBuyers: number
    returningBuyers: number
    neverOrderedAccounts: number
    onboardedActiveAccounts?: number
    trainingComplete?: number
    medianAccountAov: number
    averageOrdersPerActive: number
    boughtLast30Days: number
    orderingAccounts: number
    newBuyerRevenueShare: number
  }
  comparisons?: {
    medianDaysSinceLastOrder: Comparison
    newBuyers: Comparison
    returningBuyers: Comparison
    neverOrderedAccounts: Comparison
    medianAccountAov: Comparison
    averageOrdersPerActive: Comparison
    newBuyerRevenueShare: Comparison
  }
  cohort?: {
    new: { revenue: number; count?: number; share?: number }
    returning: { revenue: number; count?: number; share?: number }
  }
  recencyBuckets: Array<{ label: string; count: number }>
  buyersByDivision: Array<{
    label: string
    count: number
    revenue: number
    share: number
  }>
  cohortTrend: Array<{ date: string; new: number; returning: number }>
  topCustomers: Array<{
    company_id: number | string
    company_name: string
    division?: string
    lastOrderDate?: string | null
    orderCount: number
    periodRevenue: number
    revenueShare?: number
    trainingStatus?: string | null
  }>
  awaitingAccessAccounts?: Array<{
    company_id: number | string
    company_name: string
    division?: string
    lastOrderDate?: string | null
    orderCount: number
    periodRevenue: number
    revenueShare?: number
    trainingStatus?: string | null
  }>
}

export type ProductDashboard = {
  summary: {
    unitsSold: number
    uniqueProducts: number
    brandCount: number
    unitsPerSku: number
    unitsPerOrder: number
    skusTo80?: number
    leadingBrandName?: string
    leadingBrandShare: number
  }
  comparisons?: Record<string, Comparison | undefined>
  brandComposition?: NamedMixSlice[]
  brandMix: NamedMixSlice[]
  skuPareto?: {
    rankFor80?: number
    totalSkus?: number
    points?: Array<{
      rank: number
      share: number
      cumulativeShare: number
      sku?: string
      revenue?: number
    }>
  }
  topBrands?: Array<{
    brand?: string
    revenue: number
    unitsSold: number
  }>
  topProducts: Array<{
    product_id: number | string
    product_name: string
    sku?: string
    brand?: string
    unitsSold: number
    orderCount?: number
    revenue: number
  }>
}

export type DivisionDashboard = {
  summary: {
    divisionsWithOrders: number
    avgCompaniesPerDivision: number
    avgRevenuePerDivision: number
    leadingDivisionCompanyShare: number
    leadingDivisionName?: string
    leadingDivisionShare: number
  }
  comparisons?: Record<string, Comparison | undefined>
  divisions: Array<{
    division?: string
    divisionCode?: string
    companyCount: number
    orderCount: number
    revenue: number
    averageOrderValue: number
    revenuePerCompany: number
    revenueChange?: number
    revenuePercentChange?: number
  }>
  onboardingByDivision: Array<{
    division: string
    divisionCode?: string
    onboarded: number
    pending: number
    pendingRate: number
    complete: number
    completeRate: number
    activated: number
    activatedRate: number
  }>
}

export type GeographyDashboard = {
  summary: {
    statesWithOrders: number
    avgCompaniesPerState: number
    avgRevenuePerState: number
    statesFor80PercentRevenue: number
    leadingStateName?: string
    leadingStateShare: number
  }
  comparisons?: Record<string, Comparison | undefined>
  stateMix?: NamedMixSlice[]
  states: Array<{
    fips?: string
    state?: string
    name?: string
    revenue: number
    companyCount: number
    orderCount: number
    revenueShare?: number
  }>
  topStates?: Array<{
    state?: string
    companyCount: number
    orderCount: number
    revenue: number
    revenueShare?: number
  }>
  productivity?: Array<{
    state?: string
    companyCount: number
    revenuePerCompany: number
  }>
  untappedStates?: Array<{
    state?: string
    companyCount: number
  }>
  periodComparison?: Array<{
    name: string
    current: number
    previous: number
    change: number
    percentChange: number
  }>
}

function toQuery(filters: DateFilters = {}): string {
  const params = new URLSearchParams()
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

async function getJson<T>(path: string, filters?: DateFilters): Promise<T> {
  const response = await fetch(apiUrl(`${path}${toQuery(filters)}`), {
    credentials: "omit",
    headers: { Accept: "application/json" },
  })
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`)
  }
  return (await response.json()) as T
}

/**
 * Thin fetch client. Paths follow the Vite `/api` proxy shape so an empty
 * `apiBaseUrl` keeps local relative URLs working.
 */
export const api = {
  scoreboard: (filters?: DateFilters) =>
    getJson<ScoreboardDashboard>("/api/executive", filters),
  customers: (filters?: DateFilters) =>
    getJson<CustomerDashboard>("/api/customers", filters),
  products: (filters?: DateFilters) =>
    getJson<ProductDashboard>("/api/products", filters),
  divisions: (filters?: DateFilters) =>
    getJson<DivisionDashboard>("/api/divisions", filters),
  geography: (filters?: DateFilters) =>
    getJson<GeographyDashboard>("/api/geography", filters),
}
