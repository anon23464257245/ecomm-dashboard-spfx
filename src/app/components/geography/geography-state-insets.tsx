import { useMemo, useState } from "react"

import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  ALASKA_FIPS,
  HAWAII_FIPS,
  findStateFeature,
  insetFeaturePath,
  type UsStateProperties,
  type UsStatesGeoJSON,
} from "@/lib/us-states-geo"

function formatSales(value: number) {
  return value >= 10_000 ? formatCompactCurrency(value) : formatCurrency(value)
}

type InsetSpec = {
  fips: string
  shortLabel: string
  width: number
  height: number
  /** Recenters antimeridian-crossing geometries (Alaska) so the shape fills the chip. */
  rotate?: [number, number]
}

const INSETS: InsetSpec[] = [
  // Rotate so Aleutians don't collapse mainland Alaska into a thin strip.
  { fips: ALASKA_FIPS, shortLabel: "AK", width: 128, height: 90, rotate: [154, 0] },
  { fips: HAWAII_FIPS, shortLabel: "HI", width: 96, height: 68 },
]

export type GeographyStateInsetsProps = {
  geo: UsStatesGeoJSON
  getFill: (props: UsStateProperties) => string
  selectedKeys: ReadonlySet<string>
  hasSelection: boolean
  fadedOpacity?: number
  selectedStroke?: string
  onToggle: (props: UsStateProperties) => void
  className?: string
}

export function GeographyStateInsets({
  geo,
  getFill,
  selectedKeys,
  hasSelection,
  fadedOpacity = 0.28,
  selectedStroke = "color-mix(in oklab, var(--muted-foreground) 80%, var(--foreground))",
  onToggle,
  className,
}: GeographyStateInsetsProps) {
  const [hoveredFips, setHoveredFips] = useState<string | null>(null)

  const items = useMemo(() => {
    return INSETS.flatMap((spec) => {
      const feature = findStateFeature(geo, spec.fips)
      if (!feature) return []
      const path = insetFeaturePath(feature, spec.width, spec.height, {
        padding: 4,
        rotate: spec.rotate,
      })
      if (!path) return []
      return [{ ...spec, feature, path }]
    })
  }, [geo])

  if (items.length === 0) return null

  const hovered = items.find((item) => item.fips === hoveredFips)?.feature.properties

  return (
    <div
      className={cn(
        // Bottom-left ocean corner — small stack so California stays mostly clear.
        "pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col items-start gap-1.5",
        className
      )}
    >
      {items.map((item) => {
        const props = item.feature.properties
        const isSelected = selectedKeys.has(props.fips)
        const isDimmed = hasSelection && !isSelected

        return (
          <button
            key={item.fips}
            type="button"
            aria-label={`${props.name}${isSelected ? ", selected" : ""}`}
            aria-pressed={isSelected}
            className={cn(
              "pointer-events-auto relative overflow-hidden rounded-md border bg-background/90 shadow-sm backdrop-blur-md transition-[opacity,box-shadow,border-color]",
              "border-border/70 hover:border-border focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              isSelected && "border-muted-foreground/50 shadow-md"
            )}
            style={{ width: item.width, height: item.height }}
            onClick={() => onToggle(props)}
            onMouseEnter={() => setHoveredFips(item.fips)}
            onMouseLeave={() =>
              setHoveredFips((prev) => (prev === item.fips ? null : prev))
            }
          >
            <span className="text-muted-foreground absolute top-1 left-1.5 z-10 text-[10px] font-medium tracking-wide uppercase">
              {item.shortLabel}
            </span>
            <svg
              aria-hidden="true"
              className="absolute inset-0"
              height={item.height}
              width={item.width}
            >
              <path
                d={item.path}
                fill={getFill(props)}
                opacity={isDimmed ? fadedOpacity : 1}
                stroke={
                  isSelected
                    ? selectedStroke
                    : "color-mix(in oklab, var(--muted-foreground) 45%, var(--background))"
                }
                strokeLinejoin="round"
                strokeWidth={isSelected ? 1.75 : 1}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </button>
        )
      })}

      {hovered ? (
        <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-max max-w-48 rounded-md border border-border/70 bg-[color:var(--chart-tooltip-background,#0f1f18e0)] px-2.5 py-1.5 text-xs text-[color:var(--chart-tooltip-foreground,#fff)] shadow-md">
          <p className="font-medium">{hovered.name}</p>
          <p className="text-[color:var(--chart-tooltip-muted,#c5d0ca)]">
            Revenue:{" "}
            <span className="tabular-nums text-[color:var(--chart-tooltip-foreground,#fff)]">
              {formatSales(hovered.revenue)}
            </span>
          </p>
          <p className="text-[color:var(--chart-tooltip-muted,#c5d0ca)]">
            Companies:{" "}
            <span className="tabular-nums text-[color:var(--chart-tooltip-foreground,#fff)]">
              {formatNumber(hovered.companyCount)}
            </span>
          </p>
          <p className="text-[color:var(--chart-tooltip-muted,#c5d0ca)]">
            Orders:{" "}
            <span className="tabular-nums text-[color:var(--chart-tooltip-foreground,#fff)]">
              {formatNumber(hovered.orderCount)}
            </span>
          </p>
          <p className="text-[color:var(--chart-tooltip-muted,#c5d0ca)]">
            Share:{" "}
            <span className="tabular-nums text-[color:var(--chart-tooltip-foreground,#fff)]">
              {formatPercent(hovered.revenueShare)}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}
