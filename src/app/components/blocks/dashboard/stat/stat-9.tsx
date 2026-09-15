import { ArrowDownRight, ArrowUpRight, InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type MetricItem = {
    id: string;
    label: string;
    value: string;
    changeText: string;
    changeType: "up" | "down";
    helperText: string;
    description?: string;
};

export type Stat9Props = {
    stats: MetricItem[];
    valueClassName?: string;
    gridClassName?: string;
};

const defaultStats: Stat9Props["stats"] = [
    {
        id: "visitors",
        label: "Total Visitors",
        value: "342,120",
        changeText: "4.2%",
        changeType: "up",
        helperText: "conversion: 3.1%",
    },
    {
        id: "subscriptions",
        label: "Active Subs",
        value: "12,450",
        changeText: "8.4%",
        changeType: "up",
        helperText: "MRR: $49,800",
    },
    {
        id: "bounce",
        label: "Bounce Rate",
        value: "42.5%",
        changeText: "2.1%",
        changeType: "down",
        helperText: "vs. 44.6% last week",
    },
    {
        id: "revenue",
        label: "Revenue Growth",
        value: "$124,500",
        changeText: "12.6%",
        changeType: "up",
        helperText: "ARPU: $10.00",
    },
    {
        id: "session_duration",
        label: "Avg. Session",
        value: "2m 45s",
        changeText: "12.5%",
        changeType: "up",
        helperText: "vs. 2m 26s last month",
    },
    {
        id: "churn",
        label: "Churn Rate",
        value: "2.4%",
        changeText: "0.8%",
        changeType: "down",
        helperText: "target: < 3.0%",
    },
];

export const Stat9 = ({ stats = defaultStats, valueClassName, gridClassName }: Stat9Props) => {
    return (
        <Card className="p-0">
            <CardContent className="p-0">
                <div
                    className={cn(
                        "bg-border grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6",
                        gridClassName,
                    )}>
                    {stats.map((item) => (
                        <div key={item.id} className="bg-card flex flex-col gap-3 p-6">
                            <div className="flex min-w-0 items-start justify-between gap-2">
                                <div className="flex min-w-0 flex-col gap-1">
                                    <span className="text-muted-foreground text-sm whitespace-nowrap">{item.label}</span>
                                    <span className={cn("text-2xl font-medium tracking-tight whitespace-nowrap", valueClassName)}>{item.value}</span>
                                </div>
                                {item.description ? (
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <button
                                                    type="button"
                                                    aria-label={`About ${item.label}`}
                                                    className="text-muted-foreground hover:text-foreground inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-none outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                                                >
                                                    <InfoIcon className="size-3.5" />
                                                </button>
                                            }
                                        />
                                        <TooltipContent
                                            side="top"
                                            align="end"
                                            className="max-w-56 px-2.5 py-1.5 text-left leading-relaxed"
                                        >
                                            {item.description}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : null}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                <span
                                    className={cn(
                                        "flex items-center gap-0.5 font-medium",
                                        item.changeType === "up" ? "text-brand-midtone" : "text-brand-orange",
                                    )}>
                                    {item.changeType === "up" ? (
                                        <ArrowUpRight className="size-3.5" />
                                    ) : (
                                        <ArrowDownRight className="size-3.5" />
                                    )}
                                    {item.changeText}
                                </span>
                                <span>{item.helperText}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
