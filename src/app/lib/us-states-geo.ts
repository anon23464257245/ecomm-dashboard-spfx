import type { Feature, FeatureCollection, Geometry } from "geojson"
import { geoMercator, geoPath, type GeoProjection } from "d3-geo"
import { feature } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"
import statesTopology from "us-atlas/states-10m.json"

export const ALASKA_FIPS = "02"
export const HAWAII_FIPS = "15"

/** Territories + non-state FIPS omitted from the contiguous frame. */
const EXCLUDED_FROM_CONTIGUOUS = new Set([
  ALASKA_FIPS,
  HAWAII_FIPS,
  "60",
  "66",
  "69",
  "72",
  "78",
])

export type StateMetricInput = {
  fips?: string
  state?: string
  name?: string
  revenue: number
  companyCount: number
  orderCount: number
  revenueShare?: number
}

export type UsStateProperties = {
  name: string
  fips: string
  revenue: number
  companyCount: number
  orderCount: number
  revenueShare: number
}

export type UsStatesGeoJSON = FeatureCollection<Geometry, UsStateProperties>

type StatesTopology = Topology<{ states: GeometryCollection }>
type MapMode = "state"

const topology = statesTopology as unknown as StatesTopology

const rawStates = feature(
  topology,
  topology.objects.states
) as FeatureCollection<Geometry, { name?: string }>

const STATE_NAME_TO_FIPS: Record<string, string> = {}
for (const f of rawStates.features) {
  const fips = String(f.id ?? "")
  const name = f.properties?.name
  if (fips && name) {
    STATE_NAME_TO_FIPS[name.toLowerCase()] = fips
  }
}

function resolveFips(input: StateMetricInput): string | undefined {
  if (input.fips) return String(input.fips).padStart(2, "0")
  const label = (input.state ?? input.name ?? "").trim().toLowerCase()
  if (!label) return undefined
  if (/^\d{1,2}$/.test(label)) return label.padStart(2, "0")
  return STATE_NAME_TO_FIPS[label]
}

export function buildUsStatesGeo(states: StateMetricInput[]): UsStatesGeoJSON {
  const byFips = new Map<string, StateMetricInput>()
  for (const row of states) {
    const fips = resolveFips(row)
    if (fips) byFips.set(fips, row)
  }

  const features = rawStates.features.map((f) => {
    const fips = String(f.id ?? "")
    const name = f.properties?.name ?? `State ${fips}`
    const metrics = byFips.get(fips)
    return {
      type: "Feature" as const,
      id: fips,
      geometry: f.geometry,
      properties: {
        name,
        fips,
        revenue: Number(metrics?.revenue ?? 0),
        companyCount: Number(metrics?.companyCount ?? 0),
        orderCount: Number(metrics?.orderCount ?? 0),
        revenueShare: Number(metrics?.revenueShare ?? 0),
      } satisfies UsStateProperties,
    }
  })

  return { type: "FeatureCollection", features }
}

export function contiguousUsStatesGeo(geo: UsStatesGeoJSON): UsStatesGeoJSON {
  return {
    type: "FeatureCollection",
    features: geo.features.filter(
      (f) => !EXCLUDED_FROM_CONTIGUOUS.has(f.properties.fips)
    ),
  }
}

export function findStateFeature(
  geo: UsStatesGeoJSON,
  fips: string
): Feature<Geometry, UsStateProperties> | undefined {
  return geo.features.find((f) => f.properties.fips === fips)
}

export function getMetricValue(
  props: UsStateProperties,
  _mode: MapMode = "state"
): number {
  return props.revenue
}

export function getMetricRange(
  geo: UsStatesGeoJSON,
  mode: MapMode = "state"
): { min: number; max: number } {
  const values = geo.features
    .map((f) => getMetricValue(f.properties, mode))
    .filter((v) => v > 0)
  if (values.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...values), max: Math.max(...values) }
}

export function getValueBin(
  value: number,
  min: number,
  max: number
): 0 | 1 | 2 | 3 | 4 {
  if (max <= min || value <= 0) return 0
  const t = (value - min) / (max - min)
  if (t < 0.2) return 0
  if (t < 0.4) return 1
  if (t < 0.6) return 2
  if (t < 0.8) return 3
  return 4
}

export function legendStopsFor(min: number, max: number) {
  return [0, 1, 2, 3, 4].map((bin) => {
    const lo = min + (max - min) * (bin * 0.2)
    const hi = min + (max - min) * ((bin + 1) * 0.2)
    return { bin, lo, hi }
  })
}

/**
 * Fit a Mercator projection to the contiguous US for `center={[0,0]}`.
 * Returns scale + translate for ChoroplethChart.
 */
export function fitContiguousUsProjection(
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number }
): { scale: number; translate: [number, number] } {
  const contiguous = contiguousUsStatesGeo(buildUsStatesGeo([]))
  const projection = geoMercator()
  const padded = {
    type: "FeatureCollection" as const,
    features: contiguous.features,
  }
  projection.fitExtent(
    [
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ],
    padded
  )
  // With center [0,0], ChoroplethChart applies translate as pixel offset.
  const t = projection.translate()
  return {
    scale: projection.scale(),
    translate: [t[0], t[1]],
  }
}

export function insetFeaturePath(
  feat: Feature<Geometry, UsStateProperties>,
  width: number,
  height: number,
  options?: { padding?: number; rotate?: [number, number] }
): string | null {
  const padding = options?.padding ?? 4
  const projection: GeoProjection = geoMercator()
  if (options?.rotate) {
    projection.rotate([-options.rotate[0], -options.rotate[1]])
  }
  projection.fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    feat
  )
  const path = geoPath(projection)
  return path(feat)
}
