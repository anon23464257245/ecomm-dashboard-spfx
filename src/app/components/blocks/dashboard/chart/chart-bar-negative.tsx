import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";

import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export type ChartBarNegativePoint = {
    name: string;
    value: number;
    change?: number;
};

export type ChartBarNegativeProps = {
    title?: string;
    description?: string;
    data?: ChartBarNegativePoint[];
    valueLabel?: string;
    className?: string;
};

const defaultData: ChartBarNegativePoint[] = [
    { name: "Superlite", value: 18.4, change: 210000 },
    { name: "Metro", value: 9.2, change: 84000 },
    { name: "Permacon", value: 2.1, change: 18000 },
    { name: "Pacific", value: -4.6, change: -32000 },
    { name: "APA", value: -12.8, change: -54000 },
];

const chartConfig = {
    value: {
        label: "Growth",
        color: "var(--chart-1)",
    },
    up: {
        label: "Growth",
        color: "var(--chart-1)",
    },
    down: {
        label: "Decline",
        color: "var(--brand-orange)",
    },
} satisfies ChartConfig;

function signedPercent(value: number) {
    const abs = formatPercent(Math.abs(value));
    if (value > 0) return `+${abs}`;
    if (value < 0) return `-${abs}`;
    return abs;
}

export const ChartBarNegative = ({
    title = "Period growth by division",
    description = "Revenue change vs the prior period of the same length",
    data,
    valueLabel = "Revenue Δ%",
    className,
}: ChartBarNegativeProps) => {
    const chartData = data ?? defaultData;
    const tickAngle = chartData.length > 8 ? -38 : 0;

    return (
        <Card className={cn("h-full gap-3 max-md:py-4!", className)}>
            <CardHeader className="max-md:px-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-2 sm:px-6">
                {chartData.length === 0 ? (
                    <p className="text-muted-foreground px-4 text-sm sm:px-0">No divisions with orders in this period.</p>
                ) : (
                    <>
                        <ChartContainer config={chartConfig} className="aspect-auto h-64 min-h-56 w-full flex-1">
                            <BarChart data={chartData} margin={{ left: 4, right: 8, bottom: tickAngle ? 18 : 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    angle={tickAngle}
                                    textAnchor={tickAngle ? "end" : "middle"}
                                    height={tickAngle ? 56 : 28}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={4}
                                    width={48}
                                    tickFormatter={(value) => signedPercent(Number(value))}
                                />
                                <ReferenceLine y={0} stroke="var(--border)" />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            formatter={(value, _name, item) => {
                                                const point = item.payload as ChartBarNegativePoint | undefined;
                                                const numeric = Number(value);
                                                return (
                                                    <>
                                                        <div
                                                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                            style={{
                                                                background:
                                                                    numeric >= 0
                                                                        ? "var(--chart-1)"
                                                                        : "var(--brand-orange)",
                                                            }}
                                                        />
                                                        <div className="flex flex-1 items-center justify-between gap-6 leading-none">
                                                            <span className="text-muted-foreground max-w-40 truncate whitespace-nowrap">
                                                                {String(point?.name ?? valueLabel)}
                                                            </span>
                                                            <span className="font-stat font-medium text-foreground whitespace-nowrap tabular-nums">
                                                                {signedPercent(numeric)}
                                                                {point?.change != null ? (
                                                                    <span className="text-muted-foreground ms-1.5 font-sans text-xs">
                                                                        ({formatCompactCurrency(point.change)})
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </div>
                                                    </>
                                                );
                                            }}
                                        />
                                    }
                                />
                                <Bar dataKey="value" radius={6} className="stroke-background" strokeWidth={2}>
                                    {chartData.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={entry.value >= 0 ? "var(--chart-1)" : "var(--brand-orange)"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                        <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                                <span>Growth</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--brand-orange)" }} />
                                <span>Decline</span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
