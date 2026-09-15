import { useEffect, useId, useMemo, useState } from "react";

import { ActivityIcon, type LucideIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";
import { formatCompact, formatCompactCurrency } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Chart1Point = {
    date: string;
    success?: number;
    failed?: number;
    current?: number;
    previous?: number;
    [key: string]: string | number | undefined;
};

export type Chart1Metric = {
    id: string;
    label: string;
    summary: string;
    data: Chart1Point[];
    valueFormat?: "number" | "currency";
};

export type Chart1Props = {
    title?: string;
    description?: string;
    icon?: LucideIcon;
    data?: Chart1Point[];
    currentKey?: string;
    previousKey?: string;
    currentLabel?: string;
    previousLabel?: string;
    currentColor?: string;
    previousColor?: string;
    valueFormat?: "number" | "currency";
    showRangeFilter?: boolean;
    stacked?: boolean;
    metrics?: Chart1Metric[];
    className?: string;
};

function formatChartDate(value: string, options: Intl.DateTimeFormatOptions) {
    const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) {
        return String(value);
    }
    return new Date(year, month - 1, day).toLocaleDateString("en-US", options);
}

const defaultChartData: Chart1Point[] = Array.from({ length: 90 }, (_, i) => ({
    date: new Date(Date.now() + i * 864e5).toISOString().slice(0, 10),
    success: Math.floor(Math.random() * 400) + 400,
    failed: Math.floor(Math.random() * 50) + 5,
}));

export const Chart1 = ({
    title = "API Traffic",
    description = "Last 30 days performance",
    icon: Icon = ActivityIcon,
    data,
    currentKey = "success",
    previousKey = "failed",
    currentLabel = "Success",
    previousLabel = "Failed",
    currentColor = "var(--chart-1)",
    previousColor,
    valueFormat = "number",
    showRangeFilter = false,
    stacked = false,
    metrics,
    className,
}: Chart1Props) => {
    const gradientId = useId().replace(/:/g, "");
    const isMobile = useIsMobile();
    const [timeRange, setTimeRange] = useState<string | null>("90d");
    const [activeMetricId, setActiveMetricId] = useState(metrics?.[0]?.id ?? "");
    const activeMetric = metrics?.find((metric) => metric.id === activeMetricId) ?? metrics?.[0];
    const source = activeMetric?.data ?? data ?? defaultChartData;
    const resolvedFormat = activeMetric?.valueFormat ?? valueFormat;
    const showTabs = Boolean(metrics && metrics.length > 0);

    useEffect(() => {
        if (isMobile) {
            setTimeRange("7d");
        }
    }, [isMobile]);

    const resolvedPreviousColor = previousColor ?? (stacked ? "var(--chart-2)" : "var(--chart-3)");
    const showYAxis = showTabs || stacked;
    const showLegend = showTabs || stacked;
    const areaType = stacked ? "linear" : "monotone";
    const legendItems = stacked
        ? [
              { color: resolvedPreviousColor, label: previousLabel },
              { color: currentColor, label: currentLabel },
          ]
        : [
              { color: currentColor, label: currentLabel },
              { color: resolvedPreviousColor, label: previousLabel },
          ];

    const chartConfig = {
        [currentKey]: {
            label: currentLabel,
            color: currentColor,
        },
        [previousKey]: {
            label: previousLabel,
            color: resolvedPreviousColor,
        },
    } satisfies ChartConfig;

    const filteredData = useMemo(() => {
        if (showTabs || !showRangeFilter) return source;
        const take = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        return source.slice(-take);
    }, [showTabs, showRangeFilter, source, timeRange]);

    const currentFill = `fill-${gradientId}-current`;
    const previousFill = `fill-${gradientId}-previous`;

    return (
        <Card className={cn(showTabs ? "h-full gap-0 py-0 @container/chart" : "h-full pb-3 max-2xl:gap-3 max-2xl:pt-4", className)}>
            {showTabs ? (
                <CardHeader className="grid grid-cols-1 items-stretch gap-0 overflow-hidden border-b p-0 pb-0! @min-[48rem]/chart:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 flex-col justify-center gap-1 px-4 py-4 @min-[48rem]/chart:px-6 @min-[48rem]/chart:py-5">
                        <CardTitle className="truncate text-base leading-tight @min-[48rem]/chart:text-lg">{title}</CardTitle>
                        <CardDescription className="truncate leading-snug">{description}</CardDescription>
                    </div>
                    <div className="grid min-w-0 grid-cols-2 self-stretch @min-[48rem]/chart:min-w-[22rem] @min-[90rem]/chart:min-w-[26rem]">
                        {metrics?.map((metric) => (
                            <button
                                key={metric.id}
                                type="button"
                                data-active={activeMetric?.id === metric.id}
                                aria-pressed={activeMetric?.id === metric.id}
                                className="data-[active=true]:bg-muted/50 hover:bg-muted/30 relative flex min-w-0 cursor-pointer flex-col justify-center gap-1 border-t px-3 py-4 text-left transition-colors even:border-l @min-[48rem]/chart:border-t-0 @min-[48rem]/chart:border-l @min-[48rem]/chart:px-5"
                                onClick={() => setActiveMetricId(metric.id)}
                            >
                                <span className="text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap">
                                    <span
                                        className={cn(
                                            "size-2 rounded-full",
                                            activeMetric?.id === metric.id
                                                ? "bg-foreground"
                                                : "bg-transparent ring-1 ring-muted-foreground/35",
                                        )}
                                        aria-hidden
                                    />
                                    {metric.label}
                                </span>
                                <span className="font-stat text-lg leading-none font-bold whitespace-nowrap tabular-nums @min-[48rem]/chart:text-xl @min-[64rem]/chart:text-2xl">
                                    {metric.summary}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardHeader>
            ) : (
                <CardHeader className="max-2xl:px-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-md border p-2 shadow-xs">
                            <Icon className="size-4.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <CardTitle className="leading-none">{title}</CardTitle>
                            <CardDescription className="leading-none max-sm:text-xs">{description}</CardDescription>
                        </div>
                    </div>
                    {showRangeFilter ? (
                        <CardAction>
                            <Select value={timeRange ?? "90d"} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-20 sm:w-32" size="sm" aria-label="Select time range">
                                    <SelectValue placeholder="Last 3 months" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="90d">Last 3 months</SelectItem>
                                    <SelectItem value="30d">Last 30 days</SelectItem>
                                    <SelectItem value="7d">Last 7 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardAction>
                    ) : null}
                </CardHeader>
            )}
            <CardContent className={cn("flex min-h-0 flex-1 flex-col", showTabs ? "px-2 pt-4 sm:px-5 sm:pt-6 sm:pr-6" : "px-3 pt-2 sm:px-4")}>
                <ChartContainer config={chartConfig} className="aspect-auto h-68 w-full min-h-0 flex-1">
                    <AreaChart
                        data={filteredData}
                        margin={showTabs || stacked ? { left: 8, right: 8, top: 8 } : undefined}
                    >
                        <defs>
                            <linearGradient id={currentFill} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={`var(--color-${currentKey})`} stopOpacity={stacked ? 0.9 : 0.8} />
                                <stop offset="95%" stopColor={`var(--color-${currentKey})`} stopOpacity={stacked ? 0.55 : 0.1} />
                            </linearGradient>
                            <linearGradient id={previousFill} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={`var(--color-${previousKey})`} stopOpacity={stacked ? 0.9 : 0.8} />
                                <stop offset="95%" stopColor={`var(--color-${previousKey})`} stopOpacity={stacked ? 0.55 : 0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) =>
                                formatChartDate(String(value), {
                                    month: "short",
                                    day: "numeric",
                                })
                            }
                        />
                        {showYAxis ? (
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                width={stacked ? 36 : 64}
                                tickCount={5}
                                tickMargin={8}
                                tickFormatter={(value) =>
                                    resolvedFormat === "currency"
                                        ? formatCompactCurrency(Number(value))
                                        : formatCompact(Number(value))
                                }
                            />
                        ) : null}
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    className="min-w-0"
                                    labelFormatter={(value) =>
                                        formatChartDate(String(value), {
                                            month: "long",
                                            day: "numeric",
                                        })
                                    }
                                    formatter={(value, name, item) => (
                                        <>
                                            <div
                                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                style={{ background: item.color }}
                                            />
                                            <div className="flex flex-1 items-center justify-between gap-6 leading-none">
                                                <span className="text-muted-foreground whitespace-nowrap">
                                                    {name === currentKey ? currentLabel : previousLabel}
                                                </span>
                                                <span className="font-stat font-medium text-foreground whitespace-nowrap tabular-nums">
                                                    {resolvedFormat === "currency"
                                                        ? formatCompactCurrency(Number(value))
                                                        : Number(value).toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey={previousKey}
                            type={areaType}
                            stackId={stacked ? "buyers" : undefined}
                            fill={`url(#${previousFill})`}
                            stroke={`var(--color-${previousKey})`}
                            fillOpacity={1}
                        />
                        <Area
                            dataKey={currentKey}
                            type={areaType}
                            stackId={stacked ? "buyers" : undefined}
                            fill={`url(#${currentFill})`}
                            stroke={`var(--color-${currentKey})`}
                            fillOpacity={1}
                        />
                    </AreaChart>
                </ChartContainer>
                {showLegend ? (
                    <div
                        className={cn(
                            "text-muted-foreground flex shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium",
                            stacked ? "mt-4 pb-3 sm:mt-5 sm:pb-3" : "mt-3 pb-4 sm:mt-4 sm:pb-5",
                        )}
                    >
                        {legendItems.map((item) => (
                            <div className="flex items-center gap-2" key={item.label}>
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
};
