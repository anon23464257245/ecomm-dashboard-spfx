import { useMemo } from "react";

import {
    AlertCircleIcon,
    ClockIcon,
    UserMinusIcon,
    UserPlusIcon,
    UsersIcon,
} from "lucide-react";

import { Analytics3 } from "@/components/blocks/app/analytics/analytics-3";
import { Chart1, type Chart1Point } from "@/components/blocks/dashboard/chart/chart-1";
import { Chart13, type Chart13Slice } from "@/components/blocks/dashboard/chart/chart-13";
import { ChartBarDefault, type ChartBarDefaultPoint } from "@/components/blocks/dashboard/chart/chart-bar-default";
import { Stat1 } from "@/components/blocks/dashboard/stat/stat-1";
import { Stat5 } from "@/components/blocks/dashboard/stat/stat-5";
import { Stat10, type Stat10Item } from "@/components/blocks/dashboard/stat/stat-10";
import { Stat11 } from "@/components/blocks/dashboard/stat/stat-11";
import { Table4, type Table4Customer } from "@/components/blocks/dashboard/table/table-4";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDashboardDateFilters } from "@/hooks/use-dashboard-date-filters";
import { api, type Comparison, type CustomerDashboard as CustomerDashboardData } from "@/lib/api";
import { formatCompactCurrency, formatCurrency, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { chartFill } from "@/lib/chart-fills";
import { PageTitle } from "@/components/templates/ultimate-dashboard/layouts/page-title";

function trendDirection(comparison: Comparison | undefined): "up" | "down" | "neutral" {
    const percent = comparison?.percentChange ?? 0;
    if (percent > 0) return "up";
    if (percent < 0) return "down";
    return "neutral";
}

function roundedTrend(comparison: Comparison | undefined): number | undefined {
    if (!comparison) return undefined;
    return Number((comparison.percentChange ?? 0).toFixed(1));
}

function kpiTrend(
    comparison: Comparison | undefined,
    helperText: string
): Pick<Stat10Item, "changeText" | "changeType" | "helperText"> {
    if (!comparison) {
        return { helperText };
    }

    const percent = comparison.percentChange ?? 0;
    const changeType: Stat10Item["changeType"] =
        percent > 0 ? "up" : percent < 0 ? "down" : "neutral";

    return {
        changeText: `${Math.abs(percent).toFixed(1)}%`,
        changeType,
        helperText,
    };
}

function toKpis(data: CustomerDashboardData): Stat10Item[] {
    const comparisons = data.comparisons;
    return [
        {
            id: "median-recency",
            label: "Median Days Since Last Order",
            value: formatDecimal(data.summary.medianDaysSinceLastOrder),
            description: "Median days since last order among buyers in the selected period.",
            icon: ClockIcon,
            invertTrendColor: true,
            ...kpiTrend(
                comparisons?.medianDaysSinceLastOrder,
                comparisons
                    ? `vs. ${formatDecimal(comparisons.medianDaysSinceLastOrder.previous)} last period`
                    : "Among buyers in this period"
            ),
        },
        {
            id: "new-buyers",
            label: "New Buyers",
            value: formatNumber(data.summary.newBuyers),
            description: "Accounts whose first-ever order falls in the selected period.",
            icon: UserPlusIcon,
            ...kpiTrend(
                comparisons?.newBuyers,
                comparisons
                    ? `vs. ${formatNumber(comparisons.newBuyers.previous)} last period`
                    : "First order in this range"
            ),
        },
        {
            id: "returning-buyers",
            label: "Returning Buyers",
            value: formatNumber(data.summary.returningBuyers),
            description: "Period buyers whose first order was before the selected period.",
            icon: UsersIcon,
            ...kpiTrend(
                comparisons?.returningBuyers,
                comparisons
                    ? `vs. ${formatNumber(comparisons.returningBuyers.previous)} last period`
                    : "Ordered before this range"
            ),
        },
        {
            id: "never-ordered",
            label: "Accounts Never Ordered",
            value: formatNumber(data.summary.neverOrderedAccounts),
            description:
                "Onboarded, active accounts with a live admin (no .STAGE suffix) that have never placed an order.",
            icon: UserMinusIcon,
            ...kpiTrend(
                comparisons?.neverOrderedAccounts,
                `of ${formatNumber(data.summary.onboardedActiveAccounts ?? data.summary.trainingComplete)} onboarded & active accounts`
            ),
        },
    ];
}

function toRecency(data: CustomerDashboardData): ChartBarDefaultPoint[] {
    return data.recencyBuckets.map((bucket) => ({
        label: bucket.label,
        value: bucket.count,
    }));
}

const recencyWithin90Labels = new Set(["0–30", "31–60", "61–90"]);

function countRecencyOver90(data: CustomerDashboardData): number {
    return data.recencyBuckets
        .filter((bucket) => !recencyWithin90Labels.has(bucket.label))
        .reduce((sum, bucket) => sum + bucket.count, 0);
}

function toDivisionSlices(data: CustomerDashboardData): Chart13Slice[] {
    return data.buyersByDivision.map((row, index) => ({
        name: row.label,
        value: row.count,
        fill: chartFill(index),
        detail: `${formatNumber(row.count)} ${row.count === 1 ? "Buyer" : "Buyers"} · ${formatCompactCurrency(row.revenue)}`,
        shareLabel: `${Math.round(row.share)}%`,
    }));
}

function toCohortTrend(data: CustomerDashboardData): Chart1Point[] {
    return data.cohortTrend.map((point) => ({
        date: point.date,
        new: point.new,
        returning: point.returning,
    }));
}

function toDirectoryRows(data: CustomerDashboardData): Table4Customer[] {
    const buyers = data.topCustomers.map((customer) => ({
        id: String(customer.company_id),
        name: customer.company_name,
        division: customer.division || "—",
        revenue: customer.periodRevenue,
        orderCount: customer.orderCount,
        lastOrder: customer.lastOrderDate,
        share: customer.revenueShare ?? 0,
        trainingStatus: customer.trainingStatus ?? null,
    }));
    const buyerIds = new Set(buyers.map((row) => row.id));
    const awaiting = (data.awaitingAccessAccounts ?? [])
        .filter((customer) => !buyerIds.has(String(customer.company_id)))
        .map((customer) => ({
            id: String(customer.company_id),
            name: customer.company_name,
            division: customer.division || "—",
            revenue: customer.periodRevenue,
            orderCount: customer.orderCount,
            lastOrder: customer.lastOrderDate,
            share: customer.revenueShare ?? 0,
            trainingStatus: customer.trainingStatus ?? null,
        }));
    return [...buyers, ...awaiting];
}

function CustomersLoading() {
    return (
        <>
            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                <Card className="p-0">
                    <div className="bg-border grid h-full grid-cols-1 gap-px sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="bg-card flex flex-col gap-2 p-4">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        ))}
                    </div>
                </Card>
                <div className="flex min-h-0 flex-col gap-4 sm:gap-5">
                    <div className="grid grid-cols-2 items-start gap-4 sm:gap-5">
                        <Card className="space-y-2 p-3">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-3 w-32" />
                        </Card>
                        <Card className="space-y-2 p-3">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-6 w-12" />
                            <Skeleton className="h-3 w-36" />
                        </Card>
                    </div>
                    <Card className="min-h-0 flex-1 space-y-3 p-4 sm:p-5">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="mt-6 h-16 w-full" />
                    </Card>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-[minmax(16rem,19.5rem)_minmax(0,1fr)]">
                <div className="flex h-full min-h-0 w-full flex-col gap-4 sm:gap-5">
                    <Card className="min-h-0 flex-1 basis-0 space-y-3 p-4">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-8 w-12" />
                    </Card>
                    <Card className="min-h-0 flex-1 basis-0 space-y-2 p-3">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-3 w-40" />
                    </Card>
                    <Card className="min-h-0 flex-1 basis-0 space-y-2 p-3">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-3 w-36" />
                    </Card>
                </div>
                <Card className="h-full min-h-72 space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-52" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="mt-6 h-40 w-full" />
                </Card>
            </div>
            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-[minmax(22rem,34rem)_minmax(0,1fr)]">
                <Card className="space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-32 w-full" />
                </Card>
                <Card className="space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="mt-6 h-40 w-full" />
                </Card>
            </div>
            <Card className="mt-4 space-y-3 p-4 sm:mt-5 sm:p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </Card>
        </>
    );
}

export const CustomerDashboard = () => {
    const { from, to } = useDashboardDateFilters();
    const { data, error, loading } = useAsyncData(
        () => api.customers({ from, to }),
        [from, to]
    );

    const kpis = useMemo(() => (data ? toKpis(data) : []), [data]);
    const recency = useMemo(() => (data ? toRecency(data) : []), [data]);
    const lapsed90 = useMemo(() => (data ? countRecencyOver90(data) : 0), [data]);
    const divisions = useMemo(() => (data ? toDivisionSlices(data) : []), [data]);
    const cohortTrend = useMemo(() => (data ? toCohortTrend(data) : []), [data]);
    const buyers = useMemo(() => (data ? toDirectoryRows(data) : []), [data]);
    const cohort = data?.cohort;

    return (
        <div className="@container/board min-w-0">
            <PageTitle title="Customers" />

            {error ? (
                <Alert variant="destructive" className="mt-4 sm:mt-5">
                    <AlertCircleIcon />
                    <AlertTitle>Couldn’t load customers</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {loading && !data ? <CustomersLoading /> : null}

            {data ? (
                <>
                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                        <div className="h-full min-h-0">
                            <Stat10 stats={kpis} valueClassName="font-stat" />
                        </div>
                        <div className="flex min-h-0 flex-col gap-4 sm:gap-5">
                            <div className="grid grid-cols-2 items-stretch gap-4 sm:gap-5">
                                <Stat5
                                    title="Account AOV"
                                    value={formatCurrency(data.summary.medianAccountAov)}
                                    targetText="Median of each buyer's average order"
                                    trendValue={roundedTrend(data.comparisons?.medianAccountAov)}
                                    tooltip="Median of each buyer's average order value in the selected period."
                                    valueClassName="font-stat"
                                    className="h-full self-stretch"
                                    compact
                                />
                                <Stat1
                                    title="Avg. Orders / Account"
                                    value={formatDecimal(data.summary.averageOrdersPerActive)}
                                    changeValue={
                                        data.comparisons
                                            ? `${Math.abs(data.comparisons.averageOrdersPerActive.percentChange).toFixed(1)}%`
                                            : "—"
                                    }
                                    helperText={
                                        data.comparisons ? "vs. last period" : "Among buyers in this period"
                                    }
                                    direction={trendDirection(data.comparisons?.averageOrdersPerActive)}
                                    tooltip="Average orders per buyer with at least one order in the selected period."
                                    valueClassName="font-stat"
                                    compact
                                />
                            </div>
                            <div className="min-h-0 flex-1">
                                <Analytics3
                                    title="New vs. Returning Buyers Mix"
                                    tooltip="Period buyers split by whether their first-ever order falls in this period."
                                    left={{
                                        id: "returning",
                                        label: "Returning Buyers",
                                        count: cohort?.returning.count ?? 0,
                                        revenue: cohort?.returning.revenue ?? 0,
                                        share: cohort?.returning.share ?? 0,
                                        fill: "var(--chart-1)",
                                    }}
                                    right={{
                                        id: "new",
                                        label: "New Buyers",
                                        count: cohort?.new.count ?? 0,
                                        revenue: cohort?.new.revenue ?? 0,
                                        share: cohort?.new.share ?? 0,
                                        fill: "var(--chart-2)",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-[minmax(16rem,19.5rem)_minmax(0,1fr)]">
                        <div className="flex h-full min-h-0 w-full flex-col gap-4 sm:gap-5">
                            <Stat11
                                title="Bought in Last 30 Days"
                                tooltip="Leading edge of the recency histogram. Same 0–30 bar as the chart."
                                statValue={formatNumber(data.summary.boughtLast30Days)}
                                badgeValue={
                                    data.summary.orderingAccounts > 0
                                        ? formatPercent((data.summary.boughtLast30Days / data.summary.orderingAccounts) * 100)
                                        : "0.0%"
                                }
                                badgeLabel="of buyers"
                                valueClassName="font-stat"
                                showMenu={false}
                                showIcon={false}
                                compact
                                className="min-h-0 flex-1 basis-0"
                            />
                            <Stat5
                                title="New-Buyer Revenue Share"
                                value={formatPercent(data.summary.newBuyerRevenueShare)}
                                targetText={
                                    cohort
                                        ? `${formatCompactCurrency(cohort.new.revenue)} of ${formatCompactCurrency(cohort.new.revenue + cohort.returning.revenue)}`
                                        : "Share of period revenue"
                                }
                                trendValue={roundedTrend(data.comparisons?.newBuyerRevenueShare)}
                                tooltip="Share of period revenue from accounts whose first-ever order is in this period."
                                valueClassName="font-stat"
                                className="min-h-0 flex-1 basis-0"
                                compact
                                leadingIcon
                                showIcon={false}
                            />
                            <Stat11
                                title="90+ Days Since Last Order"
                                tooltip="Buyers whose last order was more than 90 days ago. Same 91–120 through 180+ bars as the recency chart."
                                statValue={formatNumber(lapsed90)}
                                badgeValue={
                                    data.summary.orderingAccounts > 0
                                        ? formatPercent((lapsed90 / data.summary.orderingAccounts) * 100)
                                        : "0.0%"
                                }
                                badgeLabel="of buyers"
                                valueClassName="font-stat"
                                showMenu={false}
                                showIcon={false}
                                compact
                                className="min-h-0 flex-1 basis-0"
                            />
                        </div>
                        <ChartBarDefault
                            title="Order Recency"
                            description="Buyers by days since last order"
                            data={recency}
                            valueLabel="Buyers"
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-[minmax(22rem,34rem)_minmax(0,1fr)]">
                        <Chart13
                            title="Buyers by Division"
                            description="Share of ordering accounts, not revenue"
                            data={divisions}
                            centerLabel="Buyers"
                            valueFormat="number"
                            showIcon={false}
                            showPeriodSelect={false}
                            showTicks={false}
                            compact
                        />
                        <Chart1
                            title="New vs Returning Buyers"
                            description="Unique accounts ordering each day"
                            icon={UsersIcon}
                            data={cohortTrend}
                            currentKey="new"
                            previousKey="returning"
                            currentLabel="New Buyers"
                            previousLabel="Returning Buyers"
                            currentColor="var(--chart-2)"
                            previousColor="var(--chart-1)"
                            stacked
                            showRangeFilter={false}
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <Table4
                            title="Account Directory"
                            description="Searchable roster of accounts with orders in this period, ranked by revenue."
                            tooltip="Ranked by period revenue. Opens on the top 10; search, filter, or page to see the rest. A yellow dot means the account is still in training and has not started buying."
                            customers={buyers}
                            searchPlaceholder="Search accounts…"
                            emptyMessage="No buyers with orders in this period."
                        />
                    </div>
                </>
            ) : null}
        </div>
    );
};
