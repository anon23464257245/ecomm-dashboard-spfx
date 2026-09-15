import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { KpiInfoTooltip } from "@/components/blocks/dashboard/stat/kpi-info-tooltip";

export type Stat10Item = {
    id: string;
    label: string;
    value: string;
    changeText?: string;
    changeType?: "up" | "down" | "neutral";
    helperText?: string;
    description?: string;
    icon?: LucideIcon;
    invertTrendColor?: boolean;
};

export type Stat10Props = {
    stats?: Stat10Item[];
    valueClassName?: string;
};

const defaultStats: Stat10Item[] = [
    {
        id: "median-recency",
        label: "Median Days Since Last Order",
        value: "18.0",
        changeText: "6.2%",
        changeType: "down",
        helperText: "vs. 19.2 last period",
        invertTrendColor: true,
        description: "Median days since last order among buyers in the selected period.",
    },
    {
        id: "new-buyers",
        label: "New Buyers",
        value: "96",
        changeText: "12.4%",
        changeType: "up",
        helperText: "vs. 85 last period",
        description: "Accounts whose first-ever order falls in the selected period.",
    },
    {
        id: "returning-buyers",
        label: "Returning Buyers",
        value: "156",
        changeText: "4.1%",
        changeType: "up",
        helperText: "vs. 150 last period",
        description: "Period buyers whose first order was before the selected period.",
    },
    {
        id: "never-ordered",
        label: "Accounts Never Ordered",
        value: "2,130",
        changeText: "0.8%",
        changeType: "down",
        helperText: "of 1,840 onboarded & active accounts",
        description:
            "Onboarded, active accounts with a live admin (no .STAGE suffix) that have never placed an order.",
    },
];

function TrendMark({ changeType }: { changeType: NonNullable<Stat10Item["changeType"]> }) {
    if (changeType === "neutral") {
        return <MinusIcon className="size-3.5" />;
    }
    if (changeType === "up") {
        return <ArrowUpRight className="size-3.5" />;
    }
    return <ArrowDownRight className="size-3.5" />;
}

export const Stat10 = ({ stats = defaultStats, valueClassName }: Stat10Props) => {
    return (
        <Card className="h-full min-h-0 w-full flex-1 p-0">
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <div className="bg-border grid min-h-0 flex-1 grid-cols-1 gap-px sm:grid-cols-2">
                    {stats.slice(0, 4).map((item) => {
                        const Icon = item.icon;
                        const showChange = Boolean(item.changeText);
                        const invert = Boolean(item.invertTrendColor);
                        const trendColor =
                            item.changeType === "neutral"
                                ? "text-muted-foreground"
                                : item.changeType === "up"
                                  ? invert
                                      ? "text-brand-orange"
                                      : "text-brand-midtone"
                                  : invert
                                    ? "text-brand-midtone"
                                    : "text-brand-orange";
                        return (
                            <div key={item.id} className="bg-card flex h-full min-h-0 flex-col gap-2 p-4">
                                <div className="flex min-w-0 items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        {Icon ? (
                                            <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md border">
                                                <Icon className="size-3.5" />
                                            </span>
                                        ) : null}
                                        <span className="text-muted-foreground text-sm leading-snug">{item.label}</span>
                                    </div>
                                    {item.description ? (
                                        <KpiInfoTooltip label={item.label} text={item.description} />
                                    ) : null}
                                </div>
                                <span className={cn("flex flex-1 items-center text-3xl font-medium tracking-tight whitespace-nowrap", valueClassName)}>
                                    {item.value}
                                </span>
                                {showChange || item.helperText ? (
                                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
                                        {showChange ? (
                                            <span className={cn("flex items-center gap-0.5 font-medium", trendColor)}>
                                                <TrendMark changeType={item.changeType ?? "neutral"} />
                                                {item.changeText}
                                            </span>
                                        ) : null}
                                        {item.helperText ? <span>{item.helperText}</span> : null}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
