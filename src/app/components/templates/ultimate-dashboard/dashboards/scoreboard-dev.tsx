import { useMemo } from "react";

import {
    AlertCircleIcon,
    ArrowDownRightIcon,
    ArrowRightIcon,
    ArrowUpRightIcon,
} from "lucide-react";

import { Analytics5, type Analytics5Slice } from "@/components/blocks/app/analytics/analytics-5";
import { Chart1, type Chart1Point } from "@/components/blocks/dashboard/chart/chart-1";
import { KpiInfoTooltip } from "@/components/blocks/dashboard/stat/kpi-info-tooltip";
import { Stat9 } from "@/components/blocks/dashboard/stat/stat-9";
import { Table3, type Table3Product } from "@/components/blocks/dashboard/table/table-3";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDashboardDateFilters } from "@/hooks/use-dashboard-date-filters";
import { api, type Comparison, type ScoreboardDashboard } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { chartFill, CHART_FILL_OTHER } from "@/lib/chart-fills";
import { cn } from "@/lib/utils";
import { PageTitle } from "@/components/templates/ultimate-dashboard/layouts/page-title";

const CONCENTRATION_FILLS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
];

const CONCENTRATION_TIERS = [
    { id: "top5", label: "Top 5 Buyers", count: 5 },
    { id: "next10", label: "Next 10 Buyers", count: 5 },
    { id: "next35", label: "Next 35 Buyers", count: 35 },
    { id: "rest", label: "Remaining Buyers", count: null as number | null },
];

const MAX_DRILL_SLICES = 8;

function toBuyerLabel(label: string) {
    return label.replace(/Customers/gi, "Buyers");
}

/** Hidden onboarded goal used only to fill the process progress bar. */
const ONBOARDED_GOAL = 5015;

function onboardedGoalProgress(onboarded: number) {
    if (ONBOARDED_GOAL <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((onboarded / ONBOARDED_GOAL) * 100)));
}

function shareOfTotal(count: number, total: number) {
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((count / total) * 100)));
}

function shareOfOnboarded(count: number, onboarded: number) {
    return shareOfTotal(count, onboarded);
}

function kpiChange(comparison: Comparison) {
    const percent = comparison?.percentChange ?? 0;
    return {
        changeText: `${Math.abs(percent).toFixed(1)}%`,
        changeType: (percent >= 0 ? "up" : "down") as "up" | "down",
        helperText: "vs. prior period",
    };
}

function roundedChange(comparison: Comparison) {
    return Number((comparison?.percentChange ?? 0).toFixed(1));
}

function toChartSeries(
    points: ScoreboardDashboard["dailyPerformance"],
    currentKey: "currentRevenue" | "currentOrders",
    previousKey: "previousRevenue" | "previousOrders"
): Chart1Point[] {
    return points.map((point) => ({
        date: point.date,
        current: point[currentKey],
        previous: point[previousKey],
    }));
}

function toCustomerRows(data: ScoreboardDashboard): Table3Product[] {
    return data.topCustomers.map((customer) => ({
        id: String(customer.company_id),
        name: customer.company_name,
        sku: "",
        category: customer.division || "—",
        sales: customer.orderCount,
        revenue: customer.revenue,
    }));
}

function toProductRows(data: ScoreboardDashboard): Table3Product[] {
    return data.topProducts.map((product) => ({
        id: String(product.product_id),
        name: product.product_name,
        sku: product.sku || "",
        category: product.brand || "n/a",
        sales: product.unitsSold,
        revenue: product.revenue,
    }));
}

function toDrillSlices(
    buyers: ScoreboardDashboard["rankedBuyers"]
): Analytics5Slice[] {
    if (buyers.length === 0) return [];
    const named = buyers.length > MAX_DRILL_SLICES
        ? buyers.slice(0, MAX_DRILL_SLICES - 1)
        : buyers;
    const slices = named.map((buyer, index) => ({
        id: String(buyer.company_id),
        label: buyer.company_name,
        value: buyer.revenue,
        fill: chartFill(index),
    }));
    if (buyers.length > MAX_DRILL_SLICES) {
        const rest = buyers.slice(MAX_DRILL_SLICES - 1);
        slices.push({
            id: "other-buyers",
            label: "Other Buyers",
            value: rest.reduce((sum, buyer) => sum + buyer.revenue, 0),
            fill: CHART_FILL_OTHER,
        });
    }
    return slices;
}

function toConcentration(data: ScoreboardDashboard): Analytics5Slice[] {
    const ranked = data.rankedBuyers ?? [];
    if (ranked.length === 0) {
        return data.concentration.map((slice, index) => ({
            id: `tier-${index}`,
            label: toBuyerLabel(slice.label),
            value: slice.value,
            fill: CONCENTRATION_FILLS[index] ?? "var(--chart-1)",
        }));
    }

    let offset = 0;
    return CONCENTRATION_TIERS.map((tier, index) => {
        const group =
            tier.count == null
                ? ranked.slice(offset)
                : ranked.slice(offset, offset + tier.count);
        if (tier.count != null) offset += tier.count;
        const children = toDrillSlices(group);
        return {
            id: tier.id,
            label: tier.label,
            value: group.reduce((sum, buyer) => sum + buyer.revenue, 0),
            fill: CONCENTRATION_FILLS[index] ?? "var(--chart-1)",
            children: children.length > 0 ? children : undefined,
        };
    });
}

function ProcessArrow() {
    return (
        <div
            className="text-muted-foreground hidden items-center justify-center self-center @min-[72rem]/process:flex"
            aria-hidden="true"
        >
            <ArrowRightIcon className="size-4" />
        </div>
    );
}

function SegmentedProgress({
    progress,
    totalSegments = 5,
}: {
    progress: number;
    totalSegments?: number;
}) {
    const clamped = Math.min(100, Math.max(0, progress));

    return (
        <div className="bg-muted flex h-2 gap-0.5 overflow-hidden rounded-md">
            {Array.from({ length: totalSegments }).map((_, index) => {
                const segmentSize = 100 / totalSegments;
                const minPercent = index * segmentSize;
                const maxPercent = (index + 1) * segmentSize;
                let fillWidth = 0;

                if (clamped >= maxPercent) {
                    fillWidth = 100;
                } else if (clamped > minPercent) {
                    fillWidth = ((clamped - minPercent) / segmentSize) * 100;
                }

                return (
                    <div key={index} className="bg-background/60 h-full flex-1 overflow-hidden">
                        <div
                            className="bg-brand-green h-full transition-all duration-500"
                            style={{ width: `${fillWidth}%` }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

type ProcessStage = {
    id: string;
    step: string;
    title: string;
    description: string;
    value: string;
    growthValue: number;
    timeText: string;
    goalProgress: number;
    goalLabel: string;
    /** Default splits label left / percent right. percent-first reads as "x% label". */
    goalLabelOrder?: "split" | "percent-first";
};

function OnboardingProcessFrame({ stages }: { stages: ProcessStage[] }) {
    return (
        <Card className="h-full gap-4!" size="sm">
            <CardHeader className="border-b">
                <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle>Onboarding process</CardTitle>
                    <CardDescription>
                        From account creation through training and first buying activity.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="@container/process">
                <div className="grid grid-cols-1 items-stretch gap-3 @min-[48rem]/process:grid-cols-2 @min-[72rem]/process:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
                    {stages.map((stage, index) => {
                        const isFlat = stage.growthValue === 0;
                        const isPositive = stage.growthValue > 0;
                        const TrendIcon = isFlat
                            ? null
                            : isPositive
                              ? ArrowUpRightIcon
                              : ArrowDownRightIcon;
                        const trendColor = isFlat
                            ? "text-muted-foreground"
                            : isPositive
                              ? "text-brand-midtone"
                              : "text-brand-orange";

                        return (
                            <div key={stage.id} className="contents">
                                {index > 0 ? <ProcessArrow /> : null}
                                <div className="bg-muted/35 flex min-w-0 flex-col gap-3 rounded-md border p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
                                                Step {stage.step}
                                            </p>
                                            <p className="mt-1 text-sm font-medium">{stage.title}</p>
                                        </div>
                                        <KpiInfoTooltip
                                            label={stage.title}
                                            text={stage.description}
                                        />
                                    </div>
                                    <div className="font-stat text-3xl leading-none font-semibold tracking-tight">
                                        {stage.value}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                        <span className={cn("flex items-center gap-0.5", trendColor)}>
                                            {TrendIcon ? <TrendIcon className="size-4" /> : null}
                                            {isPositive ? "+" : ""}
                                            {stage.growthValue}%
                                        </span>
                                        <span className="text-muted-foreground">
                                            {stage.timeText}
                                        </span>
                                    </div>
                                    <div className="mt-auto grid gap-1.5">
                                        {stage.goalLabelOrder === "percent-first" ? (
                                            <p className="text-xs">
                                                <span className="font-medium">
                                                    {stage.goalProgress}%
                                                </span>{" "}
                                                <span className="text-muted-foreground">
                                                    {stage.goalLabel}
                                                </span>
                                            </p>
                                        ) : (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    {stage.goalLabel}
                                                </span>
                                                <span className="font-medium">
                                                    {stage.goalProgress}%
                                                </span>
                                            </div>
                                        )}
                                        <SegmentedProgress progress={stage.goalProgress} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function ScoreboardLoading() {
    return (
        <>
            <Card className="mt-4 p-0 sm:mt-5">
                <div className="bg-border grid grid-cols-1 gap-px sm:grid-cols-2 @min-[72rem]/board:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-card flex flex-col gap-3 p-6">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    ))}
                </div>
            </Card>
            <Card className="mt-4 space-y-4 p-4 sm:mt-5 sm:p-5">
                <div className="space-y-2 border-b pb-4">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 @min-[72rem]/board:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-3 rounded-md border p-4">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </div>
            </Card>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:gap-5 @min-[70rem]/board:grid-cols-12">
                <Card className="h-80 p-4 sm:p-5 @min-[70rem]/board:col-span-8">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-2 h-4 w-64" />
                    <Skeleton className="mt-6 h-52 w-full" />
                </Card>
                <Card className="h-80 p-4 sm:p-5 @min-[70rem]/board:col-span-4">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="mx-auto mt-8 size-40 rounded-full" />
                </Card>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:gap-5 @min-[70rem]/board:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                    <Card key={index} className="space-y-3 p-4 sm:p-5">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-4 w-72" />
                        <Skeleton className="h-48 w-full" />
                    </Card>
                ))}
            </div>
        </>
    );
}

export const ScoreboardDevDashboard = () => {
    const { from, to, comparisonLabel } = useDashboardDateFilters();
    const { data, error, loading } = useAsyncData(
        () => api.scoreboard({ from, to }),
        [from, to]
    );

    const kpis = useMemo(() => {
        if (!data) return [];
        return [
            {
                id: "store-revenue",
                label: "Store Revenue",
                value: formatCurrency(data.totalRevenue),
                description: "Total BigCommerce order revenue in the selected period.",
                ...kpiChange(data.revenueComparison),
            },
            {
                id: "orders-placed",
                label: "Orders Placed",
                value: formatNumber(data.totalOrders),
                description: "Number of store orders placed in the selected period.",
                ...kpiChange(data.ordersComparison),
            },
            {
                id: "aov",
                label: "Avg. Order Value",
                value: formatCurrency(data.averageOrderValue),
                description: "Store revenue divided by orders placed in the selected period.",
                ...kpiChange(data.aovComparison),
            },
            {
                id: "active-customers",
                label: "Buyers",
                value: formatNumber(data.activeCustomers),
                description: "Unique accounts that placed at least one order in the selected period.",
                ...kpiChange(data.activeCustomersComparison),
            },
            {
                id: "rev-per-active",
                label: "Rev. per Buyer",
                value: formatCurrency(data.revenuePerCustomer),
                description: "Store revenue divided by buyers in the selected period.",
                ...kpiChange(data.revenuePerCustomerComparison),
            },
            {
                id: "new-customers",
                label: "New Buyers",
                value: formatNumber(data.newCustomers),
                description: "Accounts that placed their first order in the selected period.",
                ...kpiChange(data.newCustomersComparison),
            },
        ];
    }, [data]);

    const revenueData = useMemo(
        () => toChartSeries(data?.dailyPerformance ?? [], "currentRevenue", "previousRevenue"),
        [data]
    );
    const ordersData = useMemo(
        () => toChartSeries(data?.dailyPerformance ?? [], "currentOrders", "previousOrders"),
        [data]
    );
    const topCustomers = useMemo(() => (data ? toCustomerRows(data) : []), [data]);
    const topProducts = useMemo(() => (data ? toProductRows(data) : []), [data]);
    const concentration = useMemo(() => (data ? toConcentration(data) : []), [data]);

    return (
        <div className="@container/board min-w-0">
            <PageTitle title="Executive Scoreboard" />

            {error ? (
                <Alert variant="destructive" className="mt-4 sm:mt-5">
                    <AlertCircleIcon />
                    <AlertTitle>Couldn’t load scoreboard</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {loading && !data ? <ScoreboardLoading /> : null}

            {data ? (
                <>
                    <div className="mt-4 sm:mt-5">
                        <Stat9
                            stats={kpis}
                            valueClassName="font-stat"
                            gridClassName="@min-[72rem]/board:grid-cols-6"
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <OnboardingProcessFrame
                            stages={[
                                {
                                    id: "onboarded",
                                    step: "01",
                                    title: "Accounts Onboarded",
                                    description:
                                        "Company accounts created in BigCommerce on or before the end of the selected period.",
                                    value: formatNumber(data.onboarded),
                                    growthValue: roundedChange(data.onboardedComparison),
                                    timeText: "this period",
                                    goalProgress: onboardedGoalProgress(data.onboarded),
                                    goalLabel: "Cumulative vs. Goal",
                                },
                                {
                                    id: "pending",
                                    step: "02",
                                    title: "Training Pending",
                                    description:
                                        "Onboarded companies whose admin still uses a .STAGE email and has not finished training.",
                                    value: formatNumber(data.trainingPending),
                                    growthValue: roundedChange(data.trainingPendingComparison),
                                    timeText: "this period",
                                    goalProgress: shareOfOnboarded(
                                        data.trainingPending,
                                        data.onboarded
                                    ),
                                    goalLabel: "Share of onboarded",
                                },
                                {
                                    id: "complete",
                                    step: "03",
                                    title: "Training Complete",
                                    description:
                                        "Onboarded companies whose admin has a live email (no .STAGE suffix) and can buy.",
                                    value: formatNumber(data.trainingComplete),
                                    growthValue: roundedChange(data.trainingCompleteComparison),
                                    timeText: "this period",
                                    goalProgress: shareOfOnboarded(
                                        data.trainingComplete,
                                        data.onboarded
                                    ),
                                    goalLabel: "Share of onboarded",
                                },
                                {
                                    id: "activated",
                                    step: "04",
                                    title: "Buyer Activation",
                                    description:
                                        "Unique accounts that placed at least one order in the selected period, as a share of total accounts.",
                                    value: formatNumber(data.activeCustomers),
                                    growthValue: roundedChange(data.activeCustomersComparison),
                                    timeText: "this period",
                                    goalProgress: shareOfTotal(
                                        data.activeCustomers,
                                        data.totalCompanies
                                    ),
                                    goalLabel: "of accounts buying",
                                    goalLabelOrder: "percent-first",
                                },
                            ]}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[70rem]/board:grid-cols-12">
                        <div className="h-full min-h-0 min-w-0 @min-[70rem]/board:col-span-8">
                            <Chart1
                                title="Platform Performance"
                                description={comparisonLabel}
                                metrics={[
                                    {
                                        id: "revenue",
                                        label: "Revenue",
                                        summary: formatCurrency(data.totalRevenue),
                                        data: revenueData,
                                        valueFormat: "currency",
                                    },
                                    {
                                        id: "orders",
                                        label: "Orders",
                                        summary: formatNumber(data.totalOrders),
                                        data: ordersData,
                                        valueFormat: "number",
                                    },
                                ]}
                                currentKey="current"
                                previousKey="previous"
                                currentLabel="Selected period"
                                previousLabel="Previous period"
                                showRangeFilter={false}
                            />
                        </div>
                        <div className="h-full min-h-0 min-w-0 @min-[70rem]/board:col-span-4">
                            <Analytics5 data={concentration} />
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[70rem]/board:grid-cols-2">
                        <Table3
                            title="Top 10 Buyers by Revenue"
                            description="Highest-value buyers for the selected period."
                            products={topCustomers}
                            limit={10}
                            categoryLabel="Division"
                            showActions={false}
                            showSku={false}
                            rowClassName="h-14 [&>td]:h-14 [&>td]:align-middle"
                        />
                        <Table3
                            title="Top 10 products by revenue"
                            description="Highest-selling catalog items for the selected period."
                            products={topProducts}
                            limit={10}
                            categoryLabel="Brand"
                            countLabel="Units Sold"
                            showActions={false}
                            showSku
                            showBrandSwatch
                            rowClassName="h-14 [&>td]:h-14 [&>td]:align-middle"
                        />
                    </div>
                </>
            ) : null}
        </div>
    );
};
