import { useEffect, useMemo, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type Analytics10ValueFormat = "currency" | "number" | "percent";

export type Analytics10Metric = {
    id: string;
    label: string;
    format?: Analytics10ValueFormat;
};

export type Analytics10Item = {
    id: string;
    name?: string;
    label?: string;
    value?: number;
    detail?: string;
    values?: Record<string, number>;
};

export type Analytics10Props = {
    title?: string;
    description?: string;
    items?: Analytics10Item[];
    metrics?: Analytics10Metric[];
    /** Shown as a small value beside the primary number (no metric switch). */
    secondaryMetric?: Analytics10Metric;
    valueFormat?: Analytics10ValueFormat;
    pageSize?: number;
    emptyMessage?: string;
    className?: string;
};

const defaultMetrics: Analytics10Metric[] = [
    { id: "aov", label: "AOV", format: "currency" },
    { id: "revPerCompany", label: "Rev / company", format: "currency" },
];

const defaultItems: Analytics10Item[] = [
    { id: "superlite", name: "Superlite", values: { aov: 18420, revPerCompany: 41200 } },
    { id: "metro", name: "Metro", values: { aov: 15110, revPerCompany: 36850 } },
    { id: "permacon", name: "Permacon", values: { aov: 12880, revPerCompany: 29140 } },
    { id: "apa", name: "Digital Solutions", values: { aov: 9640, revPerCompany: 17620 } },
];

function itemName(item: Analytics10Item) {
    return item.name || item.label || item.id;
}

function formatMetric(value: number, valueFormat: Analytics10ValueFormat) {
    if (valueFormat === "percent") return formatPercent(value);
    if (valueFormat === "number") return formatNumber(value);
    return formatCurrency(value);
}

export const Analytics10 = ({
    title = "AOV by division",
    description = "Ranked dollar metrics per division",
    items,
    metrics,
    secondaryMetric,
    valueFormat = "currency",
    pageSize,
    emptyMessage = "No rows in this period.",
    className,
}: Analytics10Props) => {
    const metricOptions = metrics ?? (items ? [] : defaultMetrics);
    const [metricId, setMetricId] = useState(metricOptions[0]?.id ?? "");
    const [page, setPage] = useState(0);
    const activeMetric = metricOptions.find((metric) => metric.id === metricId) ?? metricOptions[0];
    const activeFormat = activeMetric?.format ?? valueFormat;
    const secondaryFormat = secondaryMetric?.format ?? "percent";

    const rows = useMemo(() => {
        const source = items ?? defaultItems;
        const key = activeMetric?.id;
        const secondaryKey = secondaryMetric?.id;
        return [...source]
            .map((item) => ({
                ...item,
                displayName: itemName(item),
                displayValue:
                    key && item.values && item.values[key] != null
                        ? Number(item.values[key])
                        : Number(item.value ?? 0),
                secondaryValue:
                    secondaryKey && item.values && item.values[secondaryKey] != null
                        ? Number(item.values[secondaryKey])
                        : null,
            }))
            .sort((a, b) => b.displayValue - a.displayValue);
    }, [activeMetric?.id, items, secondaryMetric?.id]);

    const effectivePageSize =
        typeof pageSize === "number" && pageSize > 0 ? pageSize : rows.length || 1;
    const pageCount = Math.max(1, Math.ceil(rows.length / effectivePageSize));
    const safePage = Math.min(page, pageCount - 1);
    const pageStart = safePage * effectivePageSize;
    const pageRows = rows.slice(pageStart, pageStart + effectivePageSize);
    const showPagination = typeof pageSize === "number" && pageSize > 0 && rows.length > pageSize;
    // Keep card height stable across pages by always rendering a full page of slots.
    const pageSlots =
        typeof pageSize === "number" && pageSize > 0
            ? Array.from({ length: effectivePageSize }, (_, index) => pageRows[index] ?? null)
            : pageRows;

    useEffect(() => {
        setPage(0);
    }, [activeMetric?.id, items, pageSize]);

    useEffect(() => {
        if (page > pageCount - 1) {
            setPage(Math.max(0, pageCount - 1));
        }
    }, [page, pageCount]);

    const maxValue = rows.reduce((max, row) => Math.max(max, row.displayValue), 0);
    const rangeStart = rows.length === 0 ? 0 : pageStart + 1;
    const rangeEnd = Math.min(pageStart + effectivePageSize, rows.length);

    return (
        <Card className={cn("flex h-full flex-col", className)}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                {metricOptions.length > 1 ? (
                    <CardAction>
                        <div className="flex items-center gap-1">
                            {metricOptions.map((metric) => (
                                <Button
                                    key={metric.id}
                                    type="button"
                                    size="sm"
                                    variant={metric.id === activeMetric?.id ? "default" : "outline"}
                                    className="h-7 px-2.5 text-xs"
                                    onClick={() => setMetricId(metric.id)}
                                >
                                    {metric.label}
                                </Button>
                            ))}
                        </div>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
                {rows.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                ) : (
                    pageSlots.map((item, index) => {
                        if (!item) {
                            return (
                                <div
                                    key={`empty-${pageStart + index}`}
                                    className="invisible flex items-center justify-between gap-4"
                                    aria-hidden
                                >
                                    <div className="flex min-w-0 items-baseline gap-2">
                                        <span className="w-4 shrink-0 text-xs">0</span>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">Placeholder</p>
                                            <p className="truncate text-xs">detail</p>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <p className="font-stat text-base font-medium">0</p>
                                        <div className="mt-1 flex items-center justify-end gap-2.5">
                                            <Progress value={0} className="h-1 w-30" />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        const rank = pageStart + index + 1;
                        const share = maxValue > 0 ? (item.displayValue / maxValue) * 100 : 0;
                        return (
                            <div key={item.id} className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-baseline gap-2">
                                    <span className="text-muted-foreground w-4 shrink-0 text-xs tabular-nums">
                                        {formatNumber(rank)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{item.displayName}</p>
                                        {item.detail ? (
                                            <p className="text-muted-foreground truncate text-xs">{item.detail}</p>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <p className="flex items-baseline justify-end gap-1.5">
                                        <span className="font-stat text-base font-medium">
                                            {formatMetric(item.displayValue, activeFormat)}
                                        </span>
                                        {secondaryMetric && item.secondaryValue != null ? (
                                            <span className="text-muted-foreground text-xs tabular-nums">
                                                {formatMetric(item.secondaryValue, secondaryFormat)}
                                            </span>
                                        ) : null}
                                    </p>
                                    <div className="mt-1 flex items-center justify-end gap-2.5">
                                        <Progress
                                            aria-label={`${activeMetric?.label ?? title} for ${item.displayName}`}
                                            value={share}
                                            className="bg-muted **:data-[slot=progress-indicator]:bg-primary/70 h-1 w-30 *:data-[slot=progress-track]:h-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
            {showPagination ? (
                <CardFooter className="justify-between border-t">
                    <p className="text-muted-foreground text-xs tabular-nums">
                        {formatNumber(rangeStart)}-{formatNumber(rangeEnd)} of{" "}
                        {formatNumber(rows.length)}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="size-7 p-0"
                            aria-label="Previous page"
                            disabled={safePage <= 0}
                            onClick={() => setPage((current) => Math.max(0, current - 1))}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="size-7 p-0"
                            aria-label="Next page"
                            disabled={safePage >= pageCount - 1}
                            onClick={() =>
                                setPage((current) => Math.min(pageCount - 1, current + 1))
                            }
                        >
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                </CardFooter>
            ) : null}
        </Card>
    );
};
