import { useCallback, useMemo, useState } from "react"
import { ParentSize } from "@visx/responsive"
import { Move, X } from "lucide-react"

import {
  ChoroplethChart,
  ChoroplethFeatureComponent,
  ChoroplethGraticule,
  ChoroplethTooltip,
  type ChoroplethFeature,
} from "@/components/charts/choropleth"
import { CHART_SCALE_VARS } from "@/components/charts/chart-scale"
import { GeographyStateInsets } from "@/components/geography/geography-state-insets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  buildUsStatesGeo,
  contiguousUsStatesGeo,
  fitContiguousUsProjection,
  getMetricRange,
  getMetricValue,
  getValueBin,
  legendStopsFor,
  type StateMetricInput,
  type UsStateProperties,
} from "@/lib/us-states-geo"

const MAP_ASPECT = 2 / 1
const MAP_MARGIN = { top: 12, right: 16, bottom: 12, left: 16 }
const MODE = "state" as const

function formatSales(value: number) {
  return value >= 10_000 ? formatCompactCurrency(value) : formatCurrency(value)
}

export type GeoSelection = {
  level: "state"
  key: string
  label: string
}

const EMPTY_FILL = "color-mix(in oklab, var(--muted) 70%, var(--background))"

function selectionFromFeature(props: UsStateProperties): GeoSelection {
  return { level: "state", key: props.fips, label: props.name }
}

function toggleSelection(
  prev: GeoSelection[],
  next: GeoSelection
): GeoSelection[] {
  const exists = prev.some((item) => item.key === next.key)
  if (exists) {
    return prev.filter((item) => item.key !== next.key)
  }
  return [...prev, next]
}

function selectionSummary(selection: GeoSelection[]): string {
  if (selection.length === 1) return selection[0]!.label
  if (selection.length === 2) {
    return `${selection[0]!.label} + ${selection[1]!.label}`
  }
  return `${selection.length} states`
}

export type GeographyTerritoryMapProps = {
  states: StateMetricInput[]
  className?: string
}

export function GeographyTerritoryMap({
  states,
  className,
}: GeographyTerritoryMapProps) {
  const [selection, setSelection] = useState<GeoSelection[]>([])

  const usStatesGeo = useMemo(() => buildUsStatesGeo(states), [states])
  const contiguousGeo = useMemo(
    () => contiguousUsStatesGeo(usStatesGeo),
    [usStatesGeo]
  )
  const range = useMemo(
    () => getMetricRange(usStatesGeo, MODE),
    [usStatesGeo]
  )
  const legendStops = useMemo(
    () => legendStopsFor(range.min, range.max),
    [range.min, range.max]
  )

  const selectedKeys = useMemo(
    () => new Set(selection.map((item) => item.key)),
    [selection]
  )
  const hasSelection = selection.length > 0

  const filteredFeatures = useMemo(() => {
    if (!hasSelection) return usStatesGeo.features
    return usStatesGeo.features.filter((f) =>
      selectedKeys.has(f.properties.fips)
    )
  }, [hasSelection, selectedKeys, usStatesGeo.features])

  const selectedFeatureIndexes = useMemo(() => {
    if (!hasSelection) return null
    const indexes = new Set<number>()
    contiguousGeo.features.forEach((f, index) => {
      if (selectedKeys.has(f.properties.fips)) {
        indexes.add(index)
      }
    })
    return indexes
  }, [contiguousGeo.features, hasSelection, selectedKeys])

  const filteredRevenue = useMemo(
    () => filteredFeatures.reduce((sum, f) => sum + f.properties.revenue, 0),
    [filteredFeatures]
  )

  const totalRevenue = useMemo(
    () => usStatesGeo.features.reduce((sum, f) => sum + f.properties.revenue, 0),
    [usStatesGeo.features]
  )

  const statesWithRevenue = useMemo(
    () => usStatesGeo.features.filter((f) => f.properties.revenue > 0).length,
    [usStatesGeo.features]
  )

  const getFeatureColor = useCallback(
    (feature: ChoroplethFeature) => {
      const props = feature.properties as UsStateProperties
      const value = getMetricValue(props, MODE)
      if (value <= 0 || range.max <= 0) return EMPTY_FILL
      return CHART_SCALE_VARS[getValueBin(value, range.min, range.max)]
    },
    [range.max, range.min]
  )

  const getInsetFill = useCallback(
    (props: UsStateProperties) => {
      const value = getMetricValue(props, MODE)
      if (value <= 0 || range.max <= 0) return EMPTY_FILL
      return CHART_SCALE_VARS[getValueBin(value, range.min, range.max)]
    },
    [range.max, range.min]
  )

  const getFeatureValue = useCallback((feature: ChoroplethFeature) => {
    const props = feature.properties as UsStateProperties
    return getMetricValue(props, MODE)
  }, [])

  const handleFeatureClick = useCallback((feature: ChoroplethFeature) => {
    const props = feature.properties as UsStateProperties
    setSelection((prev) => toggleSelection(prev, selectionFromFeature(props)))
  }, [])

  const handleInsetToggle = useCallback((props: UsStateProperties) => {
    setSelection((prev) => toggleSelection(prev, selectionFromFeature(props)))
  }, [])

  const ranking = useMemo(() => {
    if (hasSelection) {
      return [...filteredFeatures]
        .sort((a, b) => b.properties.revenue - a.properties.revenue)
        .slice(0, 8)
        .map((f) => ({
          key: f.properties.fips,
          name: f.properties.name,
          revenue: f.properties.revenue,
          selectAs: selectionFromFeature(f.properties),
        }))
    }

    return [...usStatesGeo.features]
      .filter((f) => f.properties.revenue > 0)
      .sort((a, b) => b.properties.revenue - a.properties.revenue)
      .slice(0, 5)
      .map((f) => ({
        key: f.properties.fips,
        name: f.properties.name,
        revenue: f.properties.revenue,
        selectAs: selectionFromFeature(f.properties),
      }))
  }, [filteredFeatures, hasSelection, usStatesGeo.features])

  const peakInFilter = useMemo(() => {
    if (filteredFeatures.length === 0) return "—"
    const peak = [...filteredFeatures].sort(
      (a, b) => b.properties.revenue - a.properties.revenue
    )[0]
    return peak?.properties.revenue ? peak.properties.name : "—"
  }, [filteredFeatures])

  const listLabel = hasSelection
    ? selection.length === 1
      ? "Selected state"
      : "Selected states"
    : "Top states"

  const clearSelection = useCallback(() => setSelection([]), [])

  return (
    <Card className={cn("flex w-full flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Territory Map</CardTitle>
            {hasSelection ? (
              <Badge variant="secondary" className="gap-1 pr-1">
                Filtered · {selectionSummary(selection)}
                <Button
                  aria-label="Clear map filter"
                  className="size-5"
                  onClick={clearSelection}
                  size="icon-xs"
                  variant="ghost"
                >
                  <X data-icon="inline-start" />
                </Button>
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            Contiguous US plus Alaska and Hawaii insets. Click to select or
            deselect.
          </CardDescription>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Move className="size-3.5" aria-hidden />
          <span>Click to toggle · scroll to zoom · hold and drag to pan</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-0 pb-4">
        <div className="relative w-full">
          <ParentSize
            debounceTime={10}
            parentSizeStyles={{ width: "100%", height: "auto" }}
          >
            {({ width }) => {
              if (width <= 0) {
                return <div className="aspect-[2/1] w-full" />
              }

              const height = width / MAP_ASPECT
              const { scale, translate } = fitContiguousUsProjection(
                width,
                height,
                MAP_MARGIN
              )

              return (
                <ChoroplethChart
                  aspectRatio="2 / 1"
                  // fitContiguousUsProjection sets translate for center [0, 0]
                  center={[0, 0]}
                  className="w-full"
                  data={contiguousGeo}
                  margin={MAP_MARGIN}
                  revealSignature={`${MODE}-${totalRevenue}`}
                  scale={scale}
                  translate={translate}
                  zoomEnabled
                  zoomMax={6}
                  // Identity zoom = full contiguous US; do not allow zooming out past that.
                  zoomMin={1}
                >
                  <ChoroplethGraticule
                    step={[10, 10]}
                    stroke="color-mix(in oklab, var(--chart-grid) 70%, transparent)"
                    strokeWidth={0.4}
                  />
                  <ChoroplethFeatureComponent
                    fadedOpacity={0.28}
                    getFeatureColor={getFeatureColor}
                    onFeatureClick={handleFeatureClick}
                    selectedFeatureIndexes={selectedFeatureIndexes}
                    selectedStroke="color-mix(in oklab, var(--muted-foreground) 80%, var(--foreground))"
                    selectedStrokeWidth={1.75}
                    stroke="var(--background)"
                    strokeWidth={0.75}
                  />
                  <ChoroplethTooltip
                    content={({ feature }) => {
                      const props = feature.properties as UsStateProperties
                      return (
                        <div className="flex min-w-40 flex-col gap-1 px-1 py-0.5 text-xs">
                          <p className="font-medium">{props.name}</p>
                          <p className="text-[color:var(--chart-tooltip-muted)]">
                            Revenue:{" "}
                            <span className="text-[color:var(--chart-tooltip-foreground)] tabular-nums">
                              {formatSales(getFeatureValue(feature))}
                            </span>
                          </p>
                          <p className="text-[color:var(--chart-tooltip-muted)]">
                            Companies:{" "}
                            <span className="text-[color:var(--chart-tooltip-foreground)] tabular-nums">
                              {formatNumber(props.companyCount)}
                            </span>
                          </p>
                          <p className="text-[color:var(--chart-tooltip-muted)]">
                            Orders:{" "}
                            <span className="text-[color:var(--chart-tooltip-foreground)] tabular-nums">
                              {formatNumber(props.orderCount)}
                            </span>
                          </p>
                          <p className="text-[color:var(--chart-tooltip-muted)]">
                            Share:{" "}
                            <span className="text-[color:var(--chart-tooltip-foreground)] tabular-nums">
                              {formatPercent(props.revenueShare)}
                            </span>
                          </p>
                        </div>
                      )
                    }}
                  />
                </ChoroplethChart>
              )
            }}
          </ParentSize>

          <GeographyStateInsets
            fadedOpacity={0.28}
            geo={usStatesGeo}
            getFill={getInsetFill}
            hasSelection={hasSelection}
            onToggle={handleInsetToggle}
            selectedKeys={selectedKeys}
            selectedStroke="color-mix(in oklab, var(--muted-foreground) 80%, var(--foreground))"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-end px-4 pl-40 sm:pr-6">
            <div className="border-border/70 bg-background/85 pointer-events-auto flex items-center gap-3 rounded-md border px-3 py-2 text-xs shadow-sm backdrop-blur-md">
              <span className="text-muted-foreground">Revenue</span>
              <div className="flex items-center gap-0.5">
                {legendStops.map((stop) => (
                  <div
                    className="size-3.5 first:rounded-l-sm last:rounded-r-sm"
                    key={stop.bin}
                    style={{
                      background:
                        range.max <= 0
                          ? EMPTY_FILL
                          : CHART_SCALE_VARS[stop.bin],
                    }}
                    title={`${formatSales(stop.lo)} – ${formatSales(stop.hi)}`}
                  />
                ))}
              </div>
              <div className="text-muted-foreground flex items-center gap-2 tabular-nums">
                <span>{formatSales(legendStops[0]?.lo ?? 0)}</span>
                <span aria-hidden>→</span>
                <span>{formatSales(range.max)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-4 sm:grid-cols-3 sm:px-6">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">
              {hasSelection ? "Filtered revenue" : "Mapped revenue"}
            </span>
            <span className="font-stat text-2xl font-medium tracking-tight tabular-nums">
              {formatSales(hasSelection ? filteredRevenue : totalRevenue)}
            </span>
            {hasSelection && totalRevenue > 0 ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatPercent((filteredRevenue / totalRevenue) * 100)} of
                mapped US revenue
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">
              {hasSelection ? "States in filter" : "States with revenue"}
            </span>
            <span className="font-stat text-2xl font-medium tracking-tight tabular-nums">
              {hasSelection
                ? filteredFeatures.filter((f) => f.properties.revenue > 0).length
                : statesWithRevenue}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">
              {hasSelection ? "Peak in filter" : "Peak state"}
            </span>
            <span className="font-stat text-2xl font-medium tracking-tight">
              {hasSelection ? peakInFilter : (ranking[0]?.name ?? "—")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {listLabel}
            </p>
            {hasSelection ? (
              <Button onClick={clearSelection} size="sm" variant="ghost">
                Clear filter
              </Button>
            ) : null}
          </div>
          <ul className="grid gap-2 sm:grid-cols-5">
            {ranking.map((item, index) => {
              const isActive = selectedKeys.has(item.selectAs.key)

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-baseline justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 hover:bg-muted"
                    )}
                    onClick={() =>
                      setSelection((prev) => toggleSelection(prev, item.selectAs))
                    }
                  >
                    <span className="truncate text-sm">
                      <span
                        className={cn(
                          "mr-1.5 tabular-nums",
                          isActive
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {index + 1}.
                      </span>
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-sm tabular-nums",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatSales(item.revenue)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {ranking.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No US state revenue in this period.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
