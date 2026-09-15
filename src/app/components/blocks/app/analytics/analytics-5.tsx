import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

import { ArrowLeftIcon } from "lucide-react";
import { Label, Pie, PieChart, Sector, type PieSectorShapeProps } from "recharts";

import { CHART_FILL_OTHER } from "@/lib/chart-fills";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export type Analytics5Slice = {
    id?: string;
    label: string;
    value: number;
    fill: string;
    children?: Analytics5Slice[];
};

export type Analytics5Props = {
    title?: string;
    description?: string;
    centerLabel?: string;
    centerValue?: string;
    data?: Analytics5Slice[];
    legendPlacement?: "below" | "end";
    /** Enlarge the below-legend donut to fill card height. */
    donutSize?: "default" | "large";
    emptyMessage?: string;
};

const defaultData: Analytics5Slice[] = [
    { label: "Top 5 Buyers", value: 2714142, fill: "var(--chart-1)" },
    { label: "Next 10 Buyers", value: 1142797, fill: "var(--chart-2)" },
    { label: "Next 35 Buyers", value: 1928470, fill: "var(--chart-3)" },
    { label: "Remaining Buyers", value: 1357071, fill: "var(--chart-4)" },
];

const chartConfig = {
    value: { label: "Revenue" },
    top5: { label: "Top 5 Buyers", color: "var(--chart-1)" },
    next10: { label: "Next 10 Buyers", color: "var(--chart-2)" },
    next35: { label: "Next 35 Buyers", color: "var(--chart-3)" },
    rest: { label: "Remaining Buyers", color: "var(--chart-4)" },
} satisfies ChartConfig;

const ACTIVE_SLICE_GROW = 8;

function sliceKey(slice: Analytics5Slice) {
    return slice.id ?? slice.label;
}

function isDrillable(slice?: Analytics5Slice | null) {
    return Boolean(slice?.children && slice.children.length > 0);
}

/**
 * Keep drilled legends the same height as the root block by folding long
 * child lists into top N-1 named rows plus a nested Other bucket.
 */
function foldSlicesToRowBudget(
    slices: Analytics5Slice[],
    maxRows: number,
    otherFill: string = CHART_FILL_OTHER
): Analytics5Slice[] {
    if (maxRows < 2 || slices.length <= maxRows) {
        return slices;
    }

    const namedCount = maxRows - 1;
    const head = slices.slice(0, namedCount);
    const tail = slices.slice(namedCount);

    // A single leftover still fits; name it instead of wrapping Other.
    if (tail.length === 1) {
        return [...head, tail[0]];
    }

    const otherValue = tail.reduce((sum, slice) => sum + slice.value, 0);

    return [
        ...head,
        {
            id: `folded-other:${namedCount}:${tail.length}:${sliceKey(tail[0])}:${otherValue}`,
            label: "Other",
            value: otherValue,
            fill: otherFill,
            children: tail,
        },
    ];
}

function resolveClickedSlice(
    item: { payload?: Analytics5Slice; index?: number } | Analytics5Slice | undefined,
    index: number | undefined,
    currentSlices: Analytics5Slice[],
) {
    if (typeof index === "number" && currentSlices[index]) {
        return currentSlices[index];
    }
    if (!item) return null;
    const payload = "payload" in item && item.payload ? item.payload : (item as Analytics5Slice);
    const key = sliceKey(payload);
    return currentSlices.find((slice) => sliceKey(slice) === key) ?? payload;
}

type DonutSliceProps = PieSectorShapeProps & {
    currentSlices: Analytics5Slice[];
    onOpenSlice: (slice?: Analytics5Slice | null) => void;
};

function DonutSlice({
    cx,
    cy,
    innerRadius,
    outerRadius = 0,
    startAngle,
    endAngle,
    fill,
    stroke,
    strokeWidth,
    isActive,
    payload,
    index,
    currentSlices,
    onOpenSlice,
}: DonutSliceProps) {
    const slice = resolveClickedSlice(payload as Analytics5Slice | undefined, index, currentSlices);
    const drillable = isDrillable(slice);

    function activate(event: { stopPropagation: () => void; preventDefault?: () => void }) {
        if (!drillable) return;
        event.stopPropagation();
        event.preventDefault?.();
        onOpenSlice(slice);
    }

    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + (isActive ? ACTIVE_SLICE_GROW : 0)}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            tabIndex={drillable ? 0 : undefined}
            role={drillable ? "button" : undefined}
            className={cn("outline-none", drillable && "cursor-pointer")}
            style={{ cursor: drillable ? "pointer" : undefined, pointerEvents: "auto" }}
            onClick={(event) => activate(event)}
            onPointerDown={(event: ReactPointerEvent<SVGElement>) => {
                if (event.button !== 0) return;
                activate(event);
            }}
        />
    );
}

export const Analytics5 = ({
    title = "Revenue Concentration",
    description = "Share of store revenue by buyer rank",
    centerLabel = "Store revenue",
    centerValue,
    data,
    legendPlacement = "below",
    donutSize = "default",
    emptyMessage = "No revenue in this period.",
}: Analytics5Props) => {
    const rootSlices = data ?? defaultData;
    const useLargeDonut = legendPlacement === "below" && donutSize === "large";
    const rootKey = useMemo(
        () => rootSlices.map((slice) => `${sliceKey(slice)}:${slice.value}`).join("|"),
        [rootSlices]
    );
    // Multi-level stack so nested Other can keep folding without growing the legend.
    const [drillStack, setDrillStack] = useState<Analytics5Slice[]>([]);

    useEffect(() => {
        setDrillStack([]);
    }, [rootKey]);

    const drilledSlice = drillStack[drillStack.length - 1] ?? null;
    const slices = useMemo(() => {
        if (!drilledSlice || !isDrillable(drilledSlice)) {
            return rootSlices;
        }
        // Match the default block's row count (e.g. top 5 + Other → 6 rows).
        return foldSlicesToRowBudget(drilledSlice.children!, rootSlices.length);
    }, [drilledSlice, rootSlices]);
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    const visibleCenterLabel = drilledSlice ? drilledSlice.label : centerLabel;
    const visibleDescription = drilledSlice
        ? `Breakdown of ${drilledSlice.label}`
        : description;

    function openSlice(slice?: Analytics5Slice | null) {
        if (!isDrillable(slice)) return;
        setDrillStack((prev) => [...prev, slice!]);
    }

    function goBack() {
        setDrillStack((prev) => prev.slice(0, -1));
    }

    return (
        <Card className="flex h-full min-h-0 w-full flex-1 flex-col">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{visibleDescription}</CardDescription>
            </CardHeader>
            <CardContent
                className={cn(
                    "flex min-h-0 flex-1",
                    slices.length === 0
                        ? "items-center"
                        : legendPlacement === "end"
                          ? "flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6"
                          : useLargeDonut
                            ? "flex-col gap-2"
                            : "flex-col gap-6"
                )}
            >
                {slices.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                ) : (
                <>
                <div
                    className={cn(
                        "relative flex justify-center",
                        legendPlacement === "end"
                            ? "h-auto w-auto shrink-0 items-center self-stretch px-2 sm:px-3"
                            : useLargeDonut
                              ? "min-h-0 flex-1 items-center px-4 py-1"
                              : "items-center px-8"
                    )}
                >
                    {drilledSlice ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="absolute top-0 left-0 z-10 cursor-pointer gap-1 px-1.5"
                            onClick={goBack}
                        >
                            <ArrowLeftIcon className="size-3.5" />
                            Back
                        </Button>
                    ) : null}
                    <div
                        className={cn(
                            legendPlacement === "end"
                                ? "aspect-square h-full w-auto max-h-full"
                                : useLargeDonut
                                  ? "aspect-square h-auto w-full max-h-[16.5rem] max-w-[16.5rem]"
                                  : "w-full max-w-52"
                        )}
                    >
                    <ChartContainer
                        config={chartConfig}
                        className={cn(
                            "aspect-square overflow-visible [&_.recharts-wrapper]:overflow-visible [&_.recharts-wrapper]:cursor-default",
                            legendPlacement === "end"
                                ? "h-full w-full max-h-none min-h-0 max-w-none"
                                : useLargeDonut
                                  ? "mx-auto h-auto w-full max-h-[16.5rem] min-h-52 max-w-[16.5rem]"
                                  : "mx-auto w-full max-w-52 min-h-44 max-h-52"
                        )}
                    >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            wrapperStyle={{ pointerEvents: "none" }}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    className="min-w-0 pointer-events-none"
                                    formatter={(value, name, item) => (
                                        <>
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                style={{ background: item.payload?.fill ?? item.color }}
                                            />
                                            <div className="flex flex-1 items-center justify-between gap-6 leading-none">
                                                <span className="text-muted-foreground max-w-40 truncate whitespace-nowrap">
                                                    {String(name ?? "")}
                                                </span>
                                                <span className="font-sans font-medium text-foreground whitespace-nowrap tabular-nums">
                                                    {formatCompactCurrency(Number(value))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                />
                            }
                        />
                        <Pie
                            data={slices}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={
                                legendPlacement === "end"
                                    ? "64%"
                                    : useLargeDonut
                                      ? "60%"
                                      : "62%"
                            }
                            outerRadius={
                                legendPlacement === "end"
                                    ? "96%"
                                    : useLargeDonut
                                      ? "92%"
                                      : "88%"
                            }
                            strokeWidth={4}
                            isAnimationActive={false}
                            shape={(props) => (
                                <DonutSlice
                                    {...props}
                                    currentSlices={slices}
                                    onOpenSlice={openSlice}
                                />
                            )}
                            onClick={(_item, index) => openSlice(resolveClickedSlice(_item, index, slices))}
                        >
                            <Label
                                zIndex={0}
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none"
                                                style={{ pointerEvents: "none" }}
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - (useLargeDonut ? 12 : 10)}
                                                    className={cn(
                                                        "fill-foreground font-stat font-semibold",
                                                        useLargeDonut ? "text-xl" : "text-lg"
                                                    )}
                                                >
                                                    {drilledSlice || !centerValue
                                                        ? formatCompactCurrency(total, 2)
                                                        : centerValue}
                                                </tspan>
                                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + (useLargeDonut ? 16 : 14)} className="fill-muted-foreground text-xs">
                                                    {visibleCenterLabel}
                                                </tspan>
                                            </text>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </Pie>
                    </PieChart>
                    </ChartContainer>
                    </div>
                </div>
                <div
                    className={cn(
                        "flex min-w-0 flex-col gap-2.5",
                        legendPlacement === "end"
                            ? "flex-1 justify-center"
                            : useLargeDonut
                              ? "shrink-0"
                              : "mt-auto shrink-0"
                    )}
                    style={
                        // Hold the default legend height so nested Other doesn't reflow the card.
                        legendPlacement === "end" && rootSlices.length > 0
                            ? {
                                  minHeight: `calc(${rootSlices.length} * 1.25rem + ${Math.max(rootSlices.length - 1, 0)} * 0.625rem)`,
                              }
                            : undefined
                    }
                >
                    {slices.map((slice) => {
                        const share = total > 0 ? (slice.value / total) * 100 : 0;
                        const drillable = isDrillable(slice);
                        const content = (
                            <>
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
                                    <span className="truncate font-medium">{slice.label}</span>
                                </div>
                                <span className="flex shrink-0 items-baseline gap-2.5">
                                    <span className="font-stat text-muted-foreground">
                                        {formatCurrency(slice.value)}
                                    </span>
                                    <span className="font-sans text-muted-foreground text-xs">
                                        ({formatPercent(share)})
                                    </span>
                                </span>
                            </>
                        );
                        if (drillable) {
                            return (
                                <button
                                    key={sliceKey(slice)}
                                    type="button"
                                    className="hover:text-foreground flex cursor-pointer items-center justify-between gap-3 text-left text-sm"
                                    onClick={() => openSlice(slice)}
                                >
                                    {content}
                                </button>
                            );
                        }
                        return (
                            <div key={sliceKey(slice)} className="flex items-center justify-between gap-3 text-sm">
                                {content}
                            </div>
                        );
                    })}
                </div>
                </>
                )}
            </CardContent>
        </Card>
    );
};
