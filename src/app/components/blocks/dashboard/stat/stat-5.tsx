import { ArrowDownRightIcon, ArrowUpRightIcon, DollarSignIcon, type LucideIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { KpiInfoTooltip } from "@/components/blocks/dashboard/stat/kpi-info-tooltip";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type Stat5Props = {
    title?: string;
    value?: string | number;
    targetText?: string;
    trendValue?: number;
    icon?: LucideIcon;
    valueClassName?: string;
    className?: string;
    compact?: boolean;
    /** Title on top like Stat 11. Metric, helper text, and trend sit on one row; no footer. */
    leadingIcon?: boolean;
    tooltip?: string;
    /** Decorative icon box. Hidden when a tooltip is set, or when passed as false. */
    showIcon?: boolean;
};

export const Stat5 = ({
    title = "Quarterly Revenue",
    value = "$142,850",
    targetText = "$150,000",
    trendValue,
    icon: Icon = DollarSignIcon,
    valueClassName,
    className,
    compact = false,
    leadingIcon = false,
    tooltip,
    showIcon = true,
}: Stat5Props) => {
    const showTrend = trendValue != null && Number.isFinite(trendValue);
    const isPositive = (trendValue ?? 0) > 0;
    const isNeutral = trendValue === 0;

    const TrendIcon = isNeutral ? MinusIcon : isPositive ? ArrowUpRightIcon : ArrowDownRightIcon;

    const trendClass = isNeutral
        ? "text-muted-foreground bg-muted/20"
        : isPositive
          ? "text-green-600 bg-green-500/10"
          : "text-destructive bg-destructive/15";

    const formattedTrend = isNeutral ? "0%" : `${isPositive ? "+" : ""}${trendValue}%`;

    const iconBox = (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-md",
                leadingIcon ? "bg-muted/40 border" : "bg-muted",
                compact || leadingIcon ? "size-8" : "size-10",
            )}
        >
            <Icon className={compact || leadingIcon ? "size-4" : "size-5"} />
        </div>
    );

    const showDecorativeIcon = showIcon && !tooltip;
    const titleText = leadingIcon ? (
        <CardTitle className="leading-none">{title}</CardTitle>
    ) : (
        <CardDescription className="font-medium">{title}</CardDescription>
    );
    const info = tooltip ? <KpiInfoTooltip label={title} text={tooltip} /> : null;

    const metric = (
        <CardTitle className={cn("font-semibold tracking-tight", compact ? "text-xl" : "text-2xl")}>
            <span className={valueClassName}>{value}</span>
        </CardTitle>
    );

    const trend = showTrend ? (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                trendClass,
            )}
        >
            <TrendIcon className="size-3.5" />
            {formattedTrend}
        </span>
    ) : null;

    if (leadingIcon) {
        return (
            <Card size="sm" className={cn("w-full gap-0 py-3", className)}>
                <CardHeader className="shrink-0 px-4">
                    <div className="flex items-start gap-3">
                        {showDecorativeIcon ? iconBox : null}
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                            <div className="min-w-0">{titleText}</div>
                            {info}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 items-center gap-3 px-4 py-0">
                    <p className={cn("text-2xl leading-none font-semibold tracking-tight", valueClassName)}>
                        {value}
                    </p>
                    <span className={cn("text-muted-foreground min-w-0 truncate", compact && "text-xs")}>
                        {targetText}
                    </span>
                    {trend}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("h-fit w-full shrink-0 self-start gap-0 py-0", className)}>
            <CardHeader
                className={cn(
                    "flex flex-1 border-b",
                    tooltip ? "items-start justify-between" : "items-center justify-between",
                    compact ? "px-4 py-3!" : "px-4 py-4!",
                )}
            >
                <div className="flex min-w-0 flex-col gap-0.5">
                    {titleText}
                    {metric}
                </div>
                {info ?? (showDecorativeIcon ? iconBox : null)}
            </CardHeader>
            <CardFooter className="bg-muted/40 mt-auto flex shrink-0 items-center justify-between gap-3 p-4!">
                <span className={cn("text-muted-foreground min-w-0 truncate", compact && "text-xs")}>{targetText}</span>
                {trend}
            </CardFooter>
        </Card>
    );
};
