import { useMemo } from "react";

import { AlertCircleIcon } from "lucide-react";

import { Analytics5, type Analytics5Slice } from "@/components/blocks/app/analytics/analytics-5";
import { Analytics8 } from "@/components/blocks/app/analytics/analytics-8";
import { Analytics10 } from "@/components/blocks/app/analytics/analytics-10";
import { Stat10, type Stat10Item } from "@/components/blocks/dashboard/stat/stat-10";
import { Table6 } from "@/components/blocks/dashboard/table/table-6";
import { GeographyTerritoryMap } from "@/components/geography/geography-territory-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDashboardDateFilters } from "@/hooks/use-dashboard-date-filters";
import { api, type Comparison, type GeographyDashboard as GeographyDashboardData } from "@/lib/api";
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { chartFill, chartFillForLabel } from "@/lib/chart-fills";
import { PageTitle } from "@/components/templates/ultimate-dashboard/layouts/page-title";

function kpiChange(comparison: Comparison | undefined): Pick<Stat10Item, "changeText" | "changeType" | "helperText"> {
    const percent = comparison?.percentChange ?? 0;
    return {
        changeText: `${Math.abs(percent).toFixed(1)}%`,
        changeType: percent > 0 ? "up" : percent < 0 ? "down" : "neutral",
        helperText: comparison ? "vs. prior period" : "In this period",
    };
}

function toStateSlices(data: GeographyDashboardData): Analytics5Slice[] {
    return (data.stateMix ?? []).map((row, index) => ({
        id: `${row.label}-${index}`,
        label: row.label,
        value: row.value,
        fill: chartFillForLabel(row.label, index),
        children: row.children?.map((child, childIndex) => ({
            id: `${child.label}-${childIndex}`,
            label: child.label,
            value: child.value,
            fill: chartFill(childIndex),
        })),
    }));
}

function GeographyLoading() {
    return (
        <>
            <div className="mt-4 flex flex-col items-stretch gap-4 sm:mt-5 sm:gap-5 lg:flex-row">
                <Card className="h-auto w-full p-0 lg:w-[32rem] lg:shrink-0">
                    <div className="bg-border grid h-full min-h-0 grid-cols-1 gap-px sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="bg-card flex flex-col gap-2 p-4">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="min-h-72 min-w-0 flex-1 space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="mx-auto mt-4 size-40 rounded-full" />
                </Card>
            </div>
            <Card className="mt-4 min-h-[32rem] p-4 sm:mt-5 sm:min-h-[36rem] sm:p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-4 w-72" />
                <Skeleton className="mt-6 min-h-80 w-full flex-1" />
            </Card>
        </>
    );
}

export const GeographyDashboard = () => {
    const { from, to } = useDashboardDateFilters();
    const { data, error, loading } = useAsyncData(
        () => api.geography({ from, to }),
        [from, to]
    );

    const kpis = useMemo((): Stat10Item[] => {
        if (!data) return [];
        const comparisons = data.comparisons;
        return [
            {
                id: "states-with-orders",
                label: "States with Orders",
                value: formatNumber(data.summary.statesWithOrders),
                description: "Distinct states with at least one order in the selected period.",
                ...kpiChange(comparisons?.statesWithOrders),
            },
            {
                id: "avg-companies",
                label: "Avg. Companies / State",
                value: formatDecimal(data.summary.avgCompaniesPerState),
                description: "Mean roster companies among states that had orders.",
                ...kpiChange(comparisons?.avgCompaniesPerState),
            },
            {
                id: "avg-revenue",
                label: "Avg. Revenue / State",
                value: formatCurrency(data.summary.avgRevenuePerState),
                description: "Mean order revenue among states that had orders.",
                ...kpiChange(comparisons?.avgRevenuePerState),
            },
            {
                id: "states-to-80",
                label: "States to 80%",
                value: formatNumber(data.summary.statesFor80PercentRevenue),
                description: "Fewest states, ranked by revenue, whose cumulative share reaches 80%. Integer depth, not a mix chart.",
                ...kpiChange(comparisons?.statesFor80PercentRevenue),
            },
        ];
    }, [data]);

    const stateSlices = useMemo(() => (data ? toStateSlices(data) : []), [data]);
    const tableRows = useMemo(
        () =>
            (data?.topStates ?? []).map((row, index) => ({
                id: row.state ?? `state-${index}`,
                name: row.state || "Unknown",
                companies: row.companyCount,
                orders: row.orderCount,
                revenue: row.revenue,
                share: row.revenueShare ?? 0,
            })),
        [data]
    );
    const changeItems = useMemo(
        () =>
            (data?.periodComparison ?? []).map((row) => ({
                id: row.name,
                name: row.name,
                current: row.current,
                previous: row.previous,
                change: row.change,
                percentChange: row.percentChange,
            })),
        [data]
    );

    return (
        <div className="@container/board min-w-0">
            <PageTitle title="Geography" />

            {error ? (
                <Alert variant="destructive" className="mt-4 sm:mt-5">
                    <AlertCircleIcon />
                    <AlertTitle>Couldn’t load geography</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {loading && !data ? <GeographyLoading /> : null}

            {data ? (
                <>
                    <div className="mt-4 flex flex-col items-stretch gap-4 sm:mt-5 sm:gap-5 lg:flex-row">
                        <div className="flex w-full min-h-0 lg:w-[32rem] lg:shrink-0">
                            <Stat10 stats={kpis} valueClassName="font-stat" />
                        </div>
                        <div className="flex min-h-0 min-w-0 flex-1">
                            <Analytics5
                                title="State Mix"
                                description="Top 5 states plus Other. Click Other to page through the rest."
                                centerLabel={data.summary.leadingStateName || "Leading state"}
                                centerValue={formatPercent(data.summary.leadingStateShare)}
                                data={stateSlices}
                                legendPlacement="end"
                            />
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <GeographyTerritoryMap states={data.states} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                        <Analytics10
                            title="Revenue per Company"
                            description="States with orders, ranked by revenue ÷ roster accounts."
                            items={(data.productivity ?? []).slice(0, 8).map((row) => ({
                                id: row.state || "unknown",
                                label: row.state || "Unknown",
                                value: row.revenuePerCompany,
                                detail: `${formatNumber(row.companyCount)} companies`,
                            }))}
                        />
                        <Analytics10
                            title="Inactive States"
                            description="Roster accounts on file with $0 in the selected period."
                            valueFormat="number"
                            items={(data.untappedStates ?? []).slice(0, 8).map((row) => ({
                                id: row.state || "unknown",
                                label: row.state || "Unknown",
                                value: row.companyCount,
                                detail: "$0 revenue",
                            }))}
                            emptyMessage="Every state with accounts ordered in this period."
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <Analytics8
                            title="Period Change by State"
                            description="Gain or loss versus the prior period of the same length."
                            items={changeItems}
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <Table6
                            title="Top States"
                            description="Companies, orders, and share of period revenue."
                            rows={tableRows}
                            emptyMessage="No state activity in this period."
                        />
                    </div>
                </>
            ) : null}
        </div>
    );
};
