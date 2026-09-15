import { useEffect, useMemo, useState } from "react";

import { PieChartIcon } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";

import { formatNumber } from "@/lib/format";
import { chartFill } from "@/lib/chart-fills";
import { cn } from "@/lib/utils";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Chart13Slice = {
    name: string;
    value: number;
    fill: string;
    detail?: string;
    shareLabel?: string;
};

export type Chart13Props = {
    title?: string;
    description?: string;
    data?: Chart13Slice[];
    centerLabel?: string;
    valueFormat?: "currency" | "number";
    showIcon?: boolean;
    showPeriodSelect?: boolean;
    showTicks?: boolean;
    compact?: boolean;
    emptyMessage?: string;
    className?: string;
};

const defaultData: Chart13Slice[] = [
    { name: "Bitcoin", value: 45000, fill: chartFill(0) },
    { name: "Ethereum", value: 28000, fill: chartFill(1) },
    { name: "Solana", value: 12000, fill: chartFill(2) },
    { name: "Cardano", value: 8500, fill: chartFill(3) },
    { name: "Polkadot", value: 4200, fill: chartFill(4) },
];

function withFills(slices: Chart13Slice[]) {
    return slices.map((slice, index) => ({
        ...slice,
        fill: slice.fill || chartFill(index),
    }));
}

function formatCenterValue(value: number, valueFormat: "currency" | "number") {
    if (valueFormat === "currency") return `$${value.toLocaleString()}`;
    return formatNumber(value);
}

export const Chart13 = ({
    title = "Portfolio Overview",
    description,
    data,
    centerLabel = "Total Value",
    valueFormat = "currency",
    showIcon = true,
    showPeriodSelect = false,
    showTicks = true,
    compact = false,
    emptyMessage = "No buyers in this period.",
    className,
}: Chart13Props) => {
    const chartData = useMemo(() => withFills(data && data.length > 0 ? data : data ? [] : defaultData), [data]);
    const dataKey = chartData.map((slice) => `${slice.name}:${slice.value}`).join("|");
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    useEffect(() => {
        setActiveIndex(null);
    }, [dataKey]);

    const totalValue = chartData.reduce((sum, slice) => sum + slice.value, 0);
    const activeItem = activeIndex !== null ? chartData[activeIndex] : null;
    const displayValue = activeItem ? activeItem.value : totalValue;
    const displayLabel = activeItem ? activeItem.name : centerLabel;

    const chartConfig = useMemo(() => {
        const config: ChartConfig = { value: { label: centerLabel } };
        chartData.forEach((slice, index) => {
            config[`slice${index}`] = { label: slice.name, color: slice.fill };
        });
        return config;
    }, [centerLabel, chartData]);

    return (
        <Card className={cn(compact ? "h-full gap-3 py-4" : "gap-0 pb-3 sm:pb-0", className)}>
            <CardHeader className={cn(compact && "px-4 pb-0")}>
                <div className="flex min-w-0 items-center gap-2.5">
                    {showIcon ? (
                        <div className="flex size-8 items-center justify-center rounded-md border">
                            <PieChartIcon className="size-4.5" />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <CardTitle className={compact ? "text-base" : undefined}>{title}</CardTitle>
                        {description ? <CardDescription>{description}</CardDescription> : null}
                    </div>
                </div>
                {showPeriodSelect ? (
                    <CardAction>
                        <Select defaultValue="weekly">
                            <SelectTrigger className="h-8 w-25 cursor-pointer capitalize">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                <SelectItem value="weekly" className="cursor-pointer">
                                    Weekly
                                </SelectItem>
                                <SelectItem value="monthly" className="cursor-pointer">
                                    Monthly
                                </SelectItem>
                                <SelectItem value="yearly" className="cursor-pointer">
                                    Yearly
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className={cn(compact ? "flex min-h-0 flex-1 flex-col px-4" : "-mt-5")}>
                {chartData.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                ) : (
                    <div
                        className={cn(
                            "grid items-center",
                            compact
                                ? "min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[auto_auto] sm:items-start"
                                : "grid-cols-1 gap-0 md:grid-cols-2",
                        )}
                    >
                        <div className={cn("flex items-center", compact ? "justify-start" : "justify-center")}>
                            <ChartContainer
                                config={chartConfig}
                                className={cn("w-full", compact ? "aspect-square h-48 max-h-48" : "h-75")}
                            >
                                <PieChart margin={compact ? { top: 0, right: 0, bottom: 0, left: 0 } : undefined}>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={compact ? "68%" : 96}
                                        outerRadius={compact ? "97%" : 120}
                                        paddingAngle={4}
                                        cornerRadius={4}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.fill}
                                                className="cursor-pointer"
                                                stroke={activeIndex === index ? "var(--foreground)" : "none"}
                                                strokeWidth={activeIndex === index ? 2 : 0}
                                                onMouseEnter={() => setActiveIndex(index)}
                                            />
                                        ))}
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                    const { cx, cy } = viewBox;
                                                    return (
                                                        <g>
                                                            {showTicks ? (
                                                                <g transform={`translate(${cx}, ${cy})`}>
                                                                    {Array.from({ length: 60 }).map((_, i) => (
                                                                        <line
                                                                            key={i}
                                                                            x1={0}
                                                                            y1={-74}
                                                                            x2={0}
                                                                            y2={-82}
                                                                            opacity={0.3}
                                                                            stroke="var(--primary)"
                                                                            strokeWidth={1}
                                                                            transform={`rotate(${i * 6})`}
                                                                        />
                                                                    ))}
                                                                </g>
                                                            ) : null}
                                                            <text
                                                                x={cx}
                                                                y={cy - 4}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                                fill="currentColor"
                                                                className={cn(
                                                                    "font-semibold transition-all duration-200",
                                                                    compact ? "font-stat text-xl" : "text-2xl",
                                                                )}
                                                            >
                                                                {formatCenterValue(displayValue, valueFormat)}
                                                            </text>
                                                            <text
                                                                x={cx}
                                                                y={cy + 16}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                                className="fill-muted-foreground text-xs font-medium transition-all duration-200"
                                                            >
                                                                {displayLabel}
                                                            </text>
                                                        </g>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </div>

                        <div
                            className={cn(
                                "flex min-h-0 flex-col",
                                compact ? "w-max min-w-68 max-w-80 gap-0.5 overflow-auto" : "divide-y",
                            )}
                        >
                            {chartData.map((item, idx) => (
                                <div className={compact ? undefined : "py-1"} key={item.name}>
                                    <div
                                        className={cn(
                                            "hover:bg-muted flex cursor-pointer items-center justify-between rounded-md py-1.5 transition-colors",
                                            compact ? "gap-3 pr-2 pl-1" : "gap-3 px-2",
                                        )}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        <div className={cn("flex min-w-0 items-center", compact ? "gap-3" : "gap-2")}>
                                            <div
                                                className={cn(
                                                    "shrink-0 rounded-md",
                                                    compact ? "size-3.5" : "size-3",
                                                )}
                                                style={{ backgroundColor: item.fill }}
                                            />
                                            <div className="min-w-0">
                                                <span
                                                    className={cn(
                                                        "block truncate text-sm",
                                                        compact ? "text-foreground font-medium" : "text-muted-foreground",
                                                    )}
                                                >
                                                    {item.name}
                                                </span>
                                                {item.detail ? (
                                                    <span className="text-muted-foreground block truncate text-xs">
                                                        {item.detail}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold">
                                            {item.shareLabel ??
                                                (valueFormat === "currency"
                                                    ? `$${item.value.toLocaleString()}`
                                                    : formatNumber(item.value))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
