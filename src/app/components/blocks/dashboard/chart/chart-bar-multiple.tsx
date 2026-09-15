import { Bar, BarChart, BarXAxis, ChartTooltip, Grid } from "@/components/charts";

import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ChartBarMultiplePoint = {
    name: string;
    revenue: number;
    units: number;
};

export type ChartBarMultipleProps = {
    title?: string;
    description?: string;
    data?: ChartBarMultiplePoint[];
    revenueLabel?: string;
    countLabel?: string;
    emptyMessage?: string;
    className?: string;
};

const defaultData: ChartBarMultiplePoint[] = [
    { name: "Brand A", revenue: 1_240_000, units: 820 },
    { name: "Brand B", revenue: 860_000, units: 640 },
    { name: "Brand C", revenue: 510_000, units: 410 },
    { name: "Brand D", revenue: 290_000, units: 260 },
    { name: "Brand E", revenue: 180_000, units: 190 },
];

export const ChartBarMultiple = ({
    title = "Brand revenue vs units",
    description = "Allocated revenue and units sold by brand",
    data,
    revenueLabel = "Allocated $",
    countLabel = "Units",
    emptyMessage = "No data in this period.",
    className,
}: ChartBarMultipleProps) => {
    const source = data ?? defaultData;
    const chartData = source.map((row) => ({
        name: row.name || "Unknown",
        revenue: row.revenue,
        units: row.units,
    }));

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
                    <>
                        <BarChart
                            data={chartData}
                            xDataKey="name"
                            aspectRatio="2.4 / 1"
                            className="w-full"
                            status="ready"
                        >
                            <Grid horizontal />
                            <Bar
                                dataKey="revenue"
                                fill="var(--chart-1)"
                                lineCap="round"
                                yAxisId="left"
                            />
                            <Bar
                                dataKey="units"
                                fill="var(--chart-2)"
                                lineCap="round"
                                yAxisId="right"
                            />
                            <BarXAxis showAllLabels={chartData.length <= 8} />
                            <ChartTooltip
                                rows={(point) => [
                                    {
                                        color: "var(--chart-1)",
                                        label: revenueLabel,
                                        value: formatCurrency(Number(point.revenue)),
                                    },
                                    {
                                        color: "var(--chart-2)",
                                        label: countLabel,
                                        value: formatNumber(Number(point.units)),
                                    },
                                ]}
                            />
                        </BarChart>
                        <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                                <span>{revenueLabel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                                <span>{countLabel}</span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
