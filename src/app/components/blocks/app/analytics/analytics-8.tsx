import { ArrowDownRight, ArrowUpRight, MinusIcon } from "lucide-react";

import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type Analytics8Item = {
    id: string;
    name: string;
    current?: number;
    previous?: number;
    change?: number;
    percentChange?: number;
};

export type Analytics8Props = {
    title?: string;
    description?: string;
    items?: Analytics8Item[];
    emptyMessage?: string;
    className?: string;
};

const defaultItems: Analytics8Item[] = [
    { id: "alaska", name: "Alaska", current: 3_077_730, previous: 58_833, change: 3_018_897, percentChange: 5131 },
    { id: "alberta", name: "Alberta", current: 530_434, previous: 28_018, change: 502_416, percentChange: 1793 },
    { id: "arizona", name: "Arizona", current: 1_346_399, previous: 995_898, change: 350_501, percentChange: 35.2 },
    { id: "pennsylvania", name: "Pennsylvania", current: 45_232, previous: 900_601, change: -855_369, percentChange: -95.0 },
];

function resolvedChange(item: Analytics8Item) {
    if (item.change != null) return item.change;
    return (item.current ?? 0) - (item.previous ?? 0);
}

function resolvedPercent(item: Analytics8Item) {
    if (item.percentChange != null) return item.percentChange;
    const current = item.current ?? 0;
    const previous = item.previous ?? 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

function signedPercent(value: number) {
    const abs = formatPercent(Math.abs(value));
    if (value > 0) return `+${abs}`;
    if (value < 0) return `-${abs}`;
    return abs;
}

function TrendIcon({ change }: { change: number }) {
    if (change > 0) return <ArrowUpRight className="size-3.5" />;
    if (change < 0) return <ArrowDownRight className="size-3.5" />;
    return <MinusIcon className="size-3.5" />;
}

function ChangeRow({ item }: { item: Analytics8Item }) {
    const percent = resolvedPercent(item);
    const change = resolvedChange(item);
    const trendColor =
        percent > 0 ? "text-brand-midtone" : percent < 0 ? "text-brand-orange" : "text-muted-foreground";

    return (
        <div className="flex items-center justify-between gap-6 border-b border-border/40 py-3 last:border-b-0">
            <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                    {formatCompactCurrency(item.current ?? 0)}
                    {item.previous != null ? ` vs ${formatCompactCurrency(item.previous)}` : ""}
                </p>
            </div>
            <div className="shrink-0 text-end">
                <p className={cn("font-stat flex items-center justify-end gap-0.5 text-base font-medium", trendColor)}>
                    <TrendIcon change={percent} />
                    {signedPercent(percent)}
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                    {change > 0 ? "+" : change < 0 ? "−" : ""}
                    {formatCompactCurrency(Math.abs(change))}
                </p>
            </div>
        </div>
    );
}

export const Analytics8 = ({
    title = "Period change by state",
    description = "Revenue gain or loss versus the prior period of the same length",
    items,
    emptyMessage = "No overlapping regions in this period.",
    className,
}: Analytics8Props) => {
    const rows = items ?? defaultItems;
    const gains = [...rows]
        .filter((row) => resolvedPercent(row) > 0)
        .sort((a, b) => resolvedPercent(b) - resolvedPercent(a));
    const losses = [...rows]
        .filter((row) => resolvedPercent(row) < 0)
        .sort((a, b) => resolvedPercent(a) - resolvedPercent(b));
    const flats = rows.filter((row) => resolvedPercent(row) === 0);

    return (
        <Card className={cn("h-full", className)}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                ) : (
                    <div
                        className={cn(
                            "grid",
                            gains.length > 0 && losses.length > 0
                                ? "divide-y divide-border/50 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
                                : "grid-cols-1"
                        )}
                    >
                        {gains.length > 0 ? (
                            <div
                                className={cn(
                                    "flex flex-col",
                                    losses.length > 0 && "pb-6 sm:pr-10 sm:pb-0"
                                )}
                            >
                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Gains</p>
                                {gains.map((item) => (
                                    <ChangeRow key={item.id} item={item} />
                                ))}
                            </div>
                        ) : null}
                        {losses.length > 0 ? (
                            <div
                                className={cn(
                                    "flex flex-col",
                                    gains.length > 0 && "pt-6 sm:pl-10 sm:pt-0"
                                )}
                            >
                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Losses</p>
                                {losses.map((item) => (
                                    <ChangeRow key={item.id} item={item} />
                                ))}
                            </div>
                        ) : null}
                        {gains.length === 0 && losses.length === 0 && flats.length > 0 ? (
                            <div className="flex flex-col">
                                {flats.map((item) => (
                                    <ChangeRow key={item.id} item={item} />
                                ))}
                            </div>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
