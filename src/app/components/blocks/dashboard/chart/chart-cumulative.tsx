import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export type ChartCumulativePoint = {
    rank: number;
    name?: string;
    cumulativeShare: number;
    revenue?: number;
};

export type ChartCumulativeProps = {
    title?: string;
    description?: string;
    data?: ChartCumulativePoint[];
    rankFor80?: number;
    totalCount?: number;
    unitLabel?: string;
    emptyMessage?: string;
    className?: string;
};

const defaultData: ChartCumulativePoint[] = [
    { rank: 1, name: "SKU A", cumulativeShare: 22 },
    { rank: 4, name: "SKU D", cumulativeShare: 48 },
    { rank: 8, name: "SKU H", cumulativeShare: 67 },
    { rank: 12, name: "SKU L", cumulativeShare: 80 },
    { rank: 20, name: "SKU T", cumulativeShare: 91 },
    { rank: 28, name: "SKU AB", cumulativeShare: 97 },
    { rank: 36, name: "SKU AJ", cumulativeShare: 100 },
];

const chartConfig = {
    cumulativeShare: {
        label: "Cumulative share",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

export const ChartCumulative = ({
    title = "SKU Pareto",
    description = "Cumulative allocated revenue as SKUs are added",
    data,
    rankFor80,
    totalCount,
    unitLabel = "SKUs",
    emptyMessage = "No items in this period.",
    className,
}: ChartCumulativeProps) => {
    const chartData = data ?? defaultData;
    const markerRank = rankFor80 ?? chartData.find((point) => point.cumulativeShare >= 80)?.rank;
    const marker = markerRank != null ? chartData.find((point) => point.rank === markerRank) : undefined;

    return (
        <Card className={cn("h-full gap-3 max-md:py-4!", className)}>
            <CardHeader className="max-md:px-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-2 sm:px-6">
                {chartData.length === 0 ? (
                    <p className="text-muted-foreground px-4 text-sm sm:px-0">{emptyMessage}</p>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                <ChartContainer config={chartConfig} className="aspect-auto h-64 min-h-56 w-full flex-1">
                    <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="rank"
                            type="number"
                            domain={["dataMin", "dataMax"]}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => formatNumber(Number(value))}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            width={40}
                            tickFormatter={(value) => `${Number(value)}%`}
                        />
                        <ReferenceLine
                            y={80}
                            stroke="var(--chart-3)"
                            strokeDasharray="4 4"
                            label={{
                                value: "80%",
                                position: "insideTopRight",
                                fill: "var(--muted-foreground)",
                                fontSize: 11,
                            }}
                        />
                        {markerRank != null ? (
                            <ReferenceLine x={markerRank} stroke="var(--chart-2)" strokeDasharray="3 3" />
                        ) : null}
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_value, payload) => {
                                        const rank = Number(payload?.[0]?.payload?.rank);
                                        return `${unitLabel.replace(/s$/, "")} rank ${formatNumber(Number.isFinite(rank) ? rank : 0)}`;
                                    }}
                                    formatter={(value, _name, item) => (
                                        <>
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                style={{ background: item.color }}
                                            />
                                            <div className="flex flex-1 items-center justify-between gap-6 leading-none">
                                                <span className="text-muted-foreground max-w-40 truncate whitespace-nowrap">
                                                    {String(item.payload?.name || "Cumulative")}
                                                </span>
                                                <span className="font-stat font-medium text-foreground tabular-nums">
                                                    {formatPercent(Number(value))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                />
                            }
                        />
                        <Area
                            dataKey="cumulativeShare"
                            type="monotone"
                            fill="var(--color-cumulativeShare)"
                            fillOpacity={0.18}
                            stroke="var(--color-cumulativeShare)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
                {marker ? (
                    <p className="text-muted-foreground mt-3 text-xs">
                        {formatNumber(marker.rank)}
                        {totalCount ? ` of ${formatNumber(totalCount)}` : ""} {unitLabel} reach{" "}
                        {formatPercent(marker.cumulativeShare)} of allocated revenue
                        {marker.name ? ` (through ${marker.name})` : ""}.
                    </p>
                ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
