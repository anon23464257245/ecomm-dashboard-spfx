import { type LucideIcon, MoreHorizontal, RefreshCw, Settings, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";

import { KpiInfoTooltip } from "@/components/blocks/dashboard/stat/kpi-info-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Stat11Props = {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    badgeValue?: string;
    badgeLabel?: string;
    statValue?: string;
    valueClassName?: string;
    showMenu?: boolean;
    className?: string;
    tooltip?: string;
    showIcon?: boolean;
    compact?: boolean;
};

export const Stat11 = ({
    icon: Icon = UserPlus,
    title = "Platform Signups",
    description = "Weekly Overview",
    badgeValue = "+12.1%",
    badgeLabel = "Weekly increase",
    statValue = "48,320",
    valueClassName,
    showMenu = true,
    className,
    tooltip,
    showIcon = true,
    compact = false,
}: Stat11Props) => {
    return (
        <Card size="sm" className={cn(compact ? "gap-0 py-3" : "gap-3.5 py-3.5", className)}>
            <CardHeader className="shrink-0 px-4">
                <div className="flex items-start gap-3">
                    {showIcon ? (
                        <div className="bg-muted/40 flex size-8 items-center justify-center rounded-md border">
                            <Icon className="size-4" />
                        </div>
                    ) : null}
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <div className="min-w-0">
                            <CardTitle className="leading-none">{title}</CardTitle>
                            {description && !tooltip ? <CardDescription>{description}</CardDescription> : null}
                        </div>
                        {tooltip ? <KpiInfoTooltip label={title} text={tooltip} /> : null}
                    </div>
                </div>
                {showMenu ? (
                    <CardAction>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="ghost" size="icon" className="cursor-pointer">
                                        <MoreHorizontal className="size-4" />
                                        <span className="sr-only">Open options</span>
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer">
                                    <RefreshCw className="size-4" />
                                    <span>Refresh</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <Settings className="size-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardAction>
                ) : null}
            </CardHeader>
            <CardContent
                className={cn(
                    "flex min-h-0 flex-1 items-center gap-4 px-4",
                    compact ? "py-0" : "py-4",
                )}
            >
                <p className={cn("text-2xl leading-none font-semibold tracking-tight", valueClassName)}>{statValue}</p>
                <Badge variant="secondary" className="gap-1">
                    <span className="text-primary font-medium">{badgeValue}</span>
                    <span className="text-muted-foreground">{badgeLabel}</span>
                </Badge>
            </CardContent>
        </Card>
    );
};
