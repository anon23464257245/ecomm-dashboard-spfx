import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export type ChartBarDefaultPoint = {
    label: string;
    value: number;
};

export type ChartBarDefaultProps = {
    title?: string;
    description?: string;
    data?: ChartBarDefaultPoint[];
    valueLabel?: string;
    className?: string;
};

const defaultData: ChartBarDefaultPoint[] = [
    { label: "0–30", value: 42 },
    { label: "31–60", value: 28 },
    { label: "61–90", value: 19 },
    { label: "91–120", value: 14 },
    { label: "121–150", value: 9 },
    { label: "151–180", value: 6 },
    { label: "180+", value: 21 },
];

const chartConfig = {
    value: {
        label: "Buyers",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

export const ChartBarDefault = ({
    title = "Order Recency",
    description = "Buyers by days since last order",
    data,
    valueLabel = "Buyers",
    className,
}: ChartBarDefaultProps) => {
    const chartData = data ?? defaultData;

    return (
        <Card className={cn("h-full gap-3 max-md:py-4!", className)}>
            <CardHeader className="max-md:px-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-2 pt-2 sm:px-6">
                <ChartContainer config={chartConfig} className="aspect-auto h-64 min-h-56 w-full flex-1">
                    <BarChart data={chartData} margin={{ left: 4, right: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            interval={0}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            width={36}
                            tickFormatter={(value) => formatNumber(Number(value))}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    formatter={(value, _name, item) => (
                                        <>
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                style={{ background: item.color }}
                                            />
                                            <div className="flex flex-1 items-center justify-between gap-6 leading-none">
                                                <span className="text-muted-foreground whitespace-nowrap">
                                                    {String(item.payload?.label ?? valueLabel)}
                                                </span>
                                                <span className="font-stat font-medium text-foreground tabular-nums">
                                                    {formatNumber(Number(value))} {valueLabel.toLowerCase()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                />
                            }
                        />
                        <Bar
                            dataKey="value"
                            fill="var(--color-value)"
                            radius={6}
                            className="stroke-background"
                            strokeWidth={2}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};
