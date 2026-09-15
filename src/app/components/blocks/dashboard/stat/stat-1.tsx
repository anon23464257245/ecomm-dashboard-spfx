import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { KpiInfoTooltip } from "@/components/blocks/dashboard/stat/kpi-info-tooltip";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type Stat1Props = {
    title: string;
    value: string | number;
    changeValue: string | number;
    direction?: "up" | "down" | "neutral";
    className?: string;
    valueClassName?: string;
    compact?: boolean;
    helperText?: string;
    tooltip?: string;
};

export const Stat1 = ({
    title,
    value,
    changeValue,
    direction = "up",
    className,
    valueClassName,
    compact = false,
    helperText,
    tooltip,
}: Stat1Props) => {
    const variants = {
        up: {
            Icon: ArrowUpRightIcon,
            color: "text-green-500",
        },
        down: {
            Icon: ArrowDownRightIcon,
            color: "text-destructive",
        },
        neutral: {
            Icon: MinusIcon,
            color: "text-muted-foreground",
        },
    };

    const { Icon, color } = variants[direction];
    const changeText = String(changeValue);
    const vsMatch = helperText ? null : changeText.match(/^(.*?)(\s+vs\..+)$/i);
    const trendLabel = vsMatch ? vsMatch[1].trim() : changeText;
    const resolvedHelper = helperText ?? vsMatch?.[2]?.trim();

    return (
        <Card className={cn("@container/card h-full", compact ? "gap-0 py-0" : "gap-4 py-4", className)}>
            <CardHeader className={cn("flex-1", compact ? "px-4 py-3" : "px-4")}>
                <div className="flex items-start justify-between gap-2">
                    <CardDescription className="font-medium">{title}</CardDescription>
                    {tooltip ? <KpiInfoTooltip label={title} text={tooltip} /> : null}
                </div>
                <CardTitle
                    className={cn(
                        "font-semibold",
                        compact ? "text-xl" : "text-2xl @[600px]/card:text-4xl @[800px]/card:text-5xl",
                        valueClassName,
                    )}
                >
                    {value}
                </CardTitle>
            </CardHeader>
            <CardFooter
                className={cn(
                    "text-muted-foreground mt-auto flex-row items-center gap-1.5 text-sm font-medium",
                    compact ? "px-4 py-4" : "px-4",
                )}
            >
                <span className={cn("inline-flex items-center gap-1 font-medium", color)}>
                    <Icon className="size-4" />
                    <span>{trendLabel}</span>
                </span>
                {resolvedHelper ? <span className="font-normal">{resolvedHelper}</span> : null}
            </CardFooter>
        </Card>
    );
};
