import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

import { KpiInfoTooltip } from "@/components/blocks/dashboard/stat/kpi-info-tooltip";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export type Analytics3Side = {
    id: string;
    label: string;
    count: number;
    revenue: number;
    share: number;
    fill?: string;
};

export type Analytics3Props = {
    title?: string;
    description?: string;
    tooltip?: string;
    emptyMessage?: string;
    left?: Analytics3Side;
    right?: Analytics3Side;
};

const defaultLeft: Analytics3Side = {
    id: "returning",
    label: "Returning Buyers",
    count: 156,
    revenue: 1289400,
    share: 62,
    fill: "var(--chart-1)",
};

const defaultRight: Analytics3Side = {
    id: "new",
    label: "New Buyers",
    count: 96,
    revenue: 412800,
    share: 38,
    fill: "var(--chart-2)",
};

function SideDetail({ side }: { side: Analytics3Side }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: side.fill ?? "var(--chart-1)" }} />
                <span className="truncate text-sm font-medium">{side.label}</span>
            </div>
            <div className="flex min-w-0 items-baseline gap-4">
                <p className="font-stat text-lg font-semibold tracking-tight">{formatNumber(side.count)}</p>
                <p className="text-muted-foreground min-w-0 truncate text-sm">
                    {formatPercent(side.share)} · {formatCurrency(side.revenue)}
                </p>
            </div>
        </div>
    );
}

export const Analytics3 = ({
    title = "New vs. Returning Buyers Mix",
    description,
    tooltip,
    emptyMessage = "No buyers in this period.",
    left,
    right,
}: Analytics3Props) => {
    const leftSide = left ?? defaultLeft;
    const rightSide = right ?? defaultRight;
    const totalShare = leftSide.share + rightSide.share;
    const empty = leftSide.count === 0 && rightSide.count === 0;

    return (
        <Card className="flex h-full min-h-0 flex-col gap-2 pt-0! pb-3!">
            <CardHeader className="grid-rows-none px-4 pt-3 pb-0">
                <div className="flex items-start justify-between gap-2">
                    <CardDescription className="font-medium">{title}</CardDescription>
                    {tooltip ? <KpiInfoTooltip label={title} text={tooltip} /> : null}
                </div>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="flex min-h-0 flex-col gap-3 pt-0">
                {empty ? (
                    <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                ) : (
                    <>
                        <div className="flex gap-6">
                            <SideDetail side={leftSide} />
                            <SideDetail side={rightSide} />
                        </div>
                        <div className="bg-muted flex h-3 w-full overflow-hidden rounded-md">
                            {[leftSide, rightSide].map((side) => {
                                const width = totalShare > 0 ? (side.share / totalShare) * 100 : 0;
                                if (width <= 0) return null;
                                return (
                                    <div
                                        key={side.id}
                                        className="h-full min-w-0"
                                        style={{
                                            width: `${width}%`,
                                            backgroundColor: side.fill ?? "var(--chart-1)",
                                        }}
                                        title={`${side.label}: ${formatPercent(side.share)}`}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
