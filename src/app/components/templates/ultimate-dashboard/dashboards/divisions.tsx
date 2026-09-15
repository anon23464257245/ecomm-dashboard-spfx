import { useEffect, useMemo, useState } from "react";

import { AlertCircleIcon, ArrowRightIcon } from "lucide-react";

import { Analytics5, type Analytics5Slice } from "@/components/blocks/app/analytics/analytics-5";
import { Analytics10, type Analytics10Item } from "@/components/blocks/app/analytics/analytics-10";
import { ChartBarMultiple } from "@/components/blocks/dashboard/chart/chart-bar-multiple";
import { ChartBarNegative } from "@/components/blocks/dashboard/chart/chart-bar-negative";
import { Stat9 } from "@/components/blocks/dashboard/stat/stat-9";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDashboardDateFilters } from "@/hooks/use-dashboard-date-filters";
import {
    api,
    type Comparison,
    type DivisionDashboard as DivisionDashboardData,
} from "@/lib/api";
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { chartFill, CHART_FILL_OTHER } from "@/lib/chart-fills";
import { PageTitle } from "@/components/templates/ultimate-dashboard/layouts/page-title";
import { cn } from "@/lib/utils";

const MIX_NAMED = 5;

function kpiChange(comparison: Comparison | undefined) {
    const percent = comparison?.percentChange ?? 0;
    return {
        changeText: `${Math.abs(percent).toFixed(1)}%`,
        changeType: (percent >= 0 ? "up" : "down") as "up" | "down",
        helperText: comparison ? "vs. prior period" : "In this period",
    };
}

function withOrders(data: DivisionDashboardData) {
    return data.divisions.filter((row) => Number(row.orderCount) > 0);
}

function toMixSlices(data: DivisionDashboardData): Analytics5Slice[] {
    const ranked = [...withOrders(data)].sort((a, b) => b.revenue - a.revenue);
    const toSlice = (
        row: (typeof ranked)[number],
        index: number
    ): Analytics5Slice => ({
        // Prefer display name so merged abbreviations (e.g. AMA/AMAE/AMAFL)
        // stay a single slice after backend consolidation by divisionName.
        id: String(row.division || row.divisionCode || index),
        label: row.division || "Unassigned",
        value: row.revenue,
        fill: chartFill(index),
    });

    const head = ranked.slice(0, MIX_NAMED);
    const tail = ranked.slice(MIX_NAMED);

    if (tail.length === 0) {
        return head.map(toSlice);
    }

    return [
        ...head.map(toSlice),
        {
            id: "other-divisions",
            label: "Other",
            value: tail.reduce((sum, row) => sum + row.revenue, 0),
            fill: CHART_FILL_OTHER,
            children: tail.map((row, index) => toSlice(row, index)),
        },
    ];
}

function toPendingRows(data: DivisionDashboardData): Analytics10Item[] {
    return [...(data.onboardingByDivision ?? [])]
        .filter((row) => row.onboarded > 0)
        .map((row, index) => ({
            id: String(row.division || row.divisionCode || index),
            name: row.division || "Unassigned",
            detail: `${formatNumber(row.onboarded)} onboarded`,
            values: {
                pendingCount: row.pending,
                pendingRate: row.pendingRate,
            },
        }));
}

function toRankedItems(data: DivisionDashboardData): Analytics10Item[] {
    return withOrders(data).map((row, index) => ({
        id: String(row.division || row.divisionCode || index),
        name: row.division || "Unassigned",
        values: {
            aov: row.averageOrderValue,
            revPerCompany: row.revenuePerCompany,
        },
    }));
}

type OnboardingRow = DivisionDashboardData["onboardingByDivision"][number];

const FUNNEL_STAGES = [
    {
        id: "onboarded",
        label: "Onboarded",
        description: "Company accounts in this division",
        rateLabel: "Share of all accounts",
        getValue: (row: OnboardingRow) => row.onboarded,
        getRate: (row: OnboardingRow, totalOnboarded: number) =>
            totalOnboarded > 0 ? (row.onboarded / totalOnboarded) * 100 : 0,
    },
    {
        id: "pending",
        label: "Training Pending",
        description: "Admin still on .STAGE email",
        rateLabel: "Share of onboarded",
        getValue: (row: OnboardingRow) => row.pending,
        getRate: (row: OnboardingRow, _totalOnboarded: number) => row.pendingRate,
    },
    {
        id: "complete",
        label: "Training Complete",
        description: "Live admin email; can buy",
        rateLabel: "Share of onboarded",
        getValue: (row: OnboardingRow) => row.complete,
        getRate: (row: OnboardingRow, _totalOnboarded: number) => row.completeRate,
    },
    {
        id: "activated",
        label: "Buyer Activation",
        description: "Ordered in the selected period",
        rateLabel: "Share of onboarded",
        getValue: (row: OnboardingRow) => row.activated,
        getRate: (row: OnboardingRow, _totalOnboarded: number) => row.activatedRate,
    },
] as const;

function FunnelProcessArrow() {
    return (
        <div
            className="text-muted-foreground hidden items-center justify-center self-center @min-[56rem]/board:flex"
            aria-hidden="true"
        >
            <ArrowRightIcon className="size-4" />
        </div>
    );
}

function OnboardingFunnelChart({
    rows,
    selectedDivision,
    onDivisionChange,
}: {
    rows: OnboardingRow[];
    selectedDivision: string;
    onDivisionChange: (division: string) => void;
}) {
    const selected =
        rows.find((row) => row.division === selectedDivision) ?? rows[0] ?? null;
    const totalOnboarded = rows.reduce((sum, row) => sum + row.onboarded, 0);

    return (
        <Card className="h-full gap-4!" size="sm">
            <CardHeader className="border-b">
                <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle>Onboarding Funnel</CardTitle>
                    <CardDescription>
                        Accounts Onboarded → Training Pending → Training Complete → Buyer
                        Activation for one division.
                    </CardDescription>
                </div>
                <CardAction>
                    <Select
                        value={selectedDivision}
                        onValueChange={(value) => {
                            if (typeof value === "string") onDivisionChange(value);
                        }}
                    >
                        <SelectTrigger size="sm" className="min-w-40" aria-label="Select division">
                            <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            {rows.map((row) => (
                                <SelectItem key={row.division} value={row.division}>
                                    {row.division}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardAction>
            </CardHeader>
            <CardContent className="@container/funnel">
                {selected ? (
                    <div className="grid grid-cols-1 items-stretch gap-3 @min-[56rem]/funnel:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
                        {FUNNEL_STAGES.map((stage, index) => {
                            const value = stage.getValue(selected);
                            const rate = stage.getRate(selected, totalOnboarded);
                            return (
                                <div key={stage.id} className="contents">
                                    {index > 0 ? <FunnelProcessArrow /> : null}
                                    <div className="bg-muted/40 flex min-w-0 flex-col gap-3 rounded-md border p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">{stage.label}</p>
                                                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                                                    {stage.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="font-stat text-3xl leading-none font-semibold tracking-tight">
                                            {formatNumber(value)}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    {stage.rateLabel}
                                                </span>
                                                <span className="font-medium">
                                                    {formatPercent(rate)}
                                                </span>
                                            </div>
                                            <div className="bg-muted flex h-2 gap-0.5 overflow-hidden rounded-md">
                                                {Array.from({ length: 5 }).map((_, segment) => {
                                                    const segmentSize = 20;
                                                    const minPercent = segment * segmentSize;
                                                    const maxPercent = (segment + 1) * segmentSize;
                                                    let fillWidth = 0;
                                                    if (rate >= maxPercent) fillWidth = 100;
                                                    else if (rate > minPercent) {
                                                        fillWidth =
                                                            ((rate - minPercent) / segmentSize) * 100;
                                                    }
                                                    return (
                                                        <div
                                                            key={segment}
                                                            className="bg-background/60 h-full flex-1 overflow-hidden"
                                                        >
                                                            <div
                                                                className="bg-brand-green h-full transition-all duration-500"
                                                                style={{ width: `${fillWidth}%` }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">No division data available.</p>
                )}
            </CardContent>
        </Card>
    );
}

function OnboardingByDivisionTable({
    rows,
    selectedDivision,
    onSelectDivision,
}: {
    rows: OnboardingRow[];
    selectedDivision: string;
    onSelectDivision: (division: string) => void;
}) {
    return (
        <Card className="h-full gap-4!" size="sm">
            <CardHeader className="border-b">
                <CardTitle>Onboarding by Division</CardTitle>
                <CardDescription>
                    Same funnel stages as structured counts. Select a row to update the chart.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Division</TableHead>
                            <TableHead className="text-right">Onboarded</TableHead>
                            <TableHead className="text-right">Pending</TableHead>
                            <TableHead className="text-right">Complete</TableHead>
                            <TableHead className="pr-6 text-right">Activated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground px-6 py-8 text-center"
                                >
                                    No division onboarding data yet. Run a full sync to load admin
                                    users.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => {
                                const isSelected = row.division === selectedDivision;
                                return (
                                    <TableRow
                                        key={row.division}
                                        className={cn(
                                            "cursor-pointer",
                                            isSelected && "bg-muted/60"
                                        )}
                                        onClick={() => onSelectDivision(row.division)}
                                    >
                                        <TableCell className="pl-6 font-medium">
                                            {row.division}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatNumber(row.onboarded)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatNumber(row.pending)}
                                            <span className="text-muted-foreground ml-1 text-xs">
                                                ({formatPercent(row.pendingRate)})
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatNumber(row.complete)}
                                            <span className="text-muted-foreground ml-1 text-xs">
                                                ({formatPercent(row.completeRate)})
                                            </span>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right tabular-nums">
                                            {formatNumber(row.activated)}
                                            <span className="text-muted-foreground ml-1 text-xs">
                                                ({formatPercent(row.activatedRate)})
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function DivisionsLoading() {
    return (
        <>
            <Card className="mt-4 p-0 sm:mt-5">
                <div className="bg-border grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="bg-card flex flex-col gap-3 p-6">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ))}
                </div>
            </Card>
            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                <Card className="space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="mx-auto mt-6 size-40 rounded-full" />
                </Card>
                <Card className="space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="mt-6 h-48 w-full" />
                </Card>
            </div>
            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                <Card className="space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="mt-6 h-56 w-full" />
                </Card>
                <Card className="space-y-3 p-4 sm:p-5">
                    <Skeleton className="h-5 w-52" />
                    <Skeleton className="h-4 w-60" />
                    <Skeleton className="mt-6 h-56 w-full" />
                </Card>
            </div>
            <Card className="mt-4 space-y-3 p-4 sm:mt-5 sm:p-5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-64 w-full" />
            </Card>
            <Card className="mt-4 space-y-3 p-4 sm:mt-5 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="h-40 w-full" />
            </Card>
            <Card className="mt-4 space-y-3 p-4 sm:mt-5 sm:p-5">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-56 w-full" />
            </Card>
        </>
    );
}

export const DivisionDashboard = () => {
    const { from, to } = useDashboardDateFilters();
    const { data, error, loading } = useAsyncData(
        () => api.divisions({ from, to }),
        [from, to]
    );
    const [selectedDivision, setSelectedDivision] = useState("");

    const onboardingRows = useMemo(
        () => data?.onboardingByDivision ?? [],
        [data]
    );

    useEffect(() => {
        if (onboardingRows.length === 0) {
            setSelectedDivision("");
            return;
        }

        const stillValid = onboardingRows.some(
            (row) => row.division === selectedDivision
        );
        if (!stillValid) {
            setSelectedDivision(onboardingRows[0].division);
        }
    }, [onboardingRows, selectedDivision]);

    const kpis = useMemo(() => {
        if (!data) return [];
        const comparisons = data.comparisons;
        return [
            {
                id: "divisions-with-orders",
                label: "Divisions With Orders",
                value: formatNumber(data.summary.divisionsWithOrders),
                description: "Distinct divisions with at least one order in the selected period.",
                ...kpiChange(comparisons?.divisionsWithOrders),
            },
            {
                id: "avg-companies",
                label: "Avg. Companies / Division",
                value: formatDecimal(data.summary.avgCompaniesPerDivision),
                description: "Mean roster companies among divisions that ordered in this period.",
                ...kpiChange(comparisons?.avgCompaniesPerDivision),
            },
            {
                id: "avg-revenue",
                label: "Avg. Revenue / Division",
                value: formatCurrency(data.summary.avgRevenuePerDivision),
                description: "Mean revenue among divisions that ordered in this period.",
                ...kpiChange(comparisons?.avgRevenuePerDivision),
            },
            {
                id: "leader-company-share",
                label: "Leader Company Share",
                value: formatPercent(data.summary.leadingDivisionCompanyShare),
                description: "Roster companies in the #1 division divided by all companies.",
                ...kpiChange(comparisons?.leadingDivisionCompanyShare),
            },
            {
                id: "leading-division-share",
                label: "Leading Division Share",
                value: formatPercent(data.summary.leadingDivisionShare),
                description: data.summary.leadingDivisionName
                    ? `${data.summary.leadingDivisionName} as a share of period revenue.`
                    : "Top division revenue divided by total period revenue.",
                ...kpiChange(comparisons?.leadingDivisionShare),
            },
        ];
    }, [data]);

    const mixSlices = useMemo(() => (data ? toMixSlices(data) : []), [data]);
    const pendingRows = useMemo(() => (data ? toPendingRows(data) : []), [data]);
    const rankedItems = useMemo(() => (data ? toRankedItems(data) : []), [data]);
    const growthBars = useMemo(() => {
        if (!data) return [];
        return withOrders(data)
            .map((row) => ({
                name: row.division || "Unassigned",
                value: row.revenuePercentChange ?? 0,
                change: row.revenueChange ?? 0,
            }))
            .sort((a, b) => b.value - a.value);
    }, [data]);
    const accountBars = useMemo(() => {
        if (!data) return [];
        return withOrders(data).map((row) => ({
            name: row.division || "Unassigned",
            revenue: row.revenue,
            units: row.companyCount,
        }));
    }, [data]);

    return (
        <div className="@container/board min-w-0">
            <PageTitle title="Divisions" />

            {error ? (
                <Alert variant="destructive" className="mt-4 sm:mt-5">
                    <AlertCircleIcon />
                    <AlertTitle>Couldn't load divisions</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {loading && !data ? <DivisionsLoading /> : null}

            {data ? (
                <>
                    <div className="mt-4 sm:mt-5">
                        <Stat9
                            stats={kpis}
                            valueClassName="font-stat"
                            gridClassName="lg:grid-cols-5 2xl:grid-cols-5"
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <OnboardingFunnelChart
                            rows={onboardingRows}
                            selectedDivision={selectedDivision}
                            onDivisionChange={setSelectedDivision}
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <OnboardingByDivisionTable
                            rows={onboardingRows}
                            selectedDivision={selectedDivision}
                            onSelectDivision={setSelectedDivision}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                        <Analytics5
                            title="Division Revenue Mix"
                            description="Top 5 divisions plus Other. Click Other to page through the rest."
                            centerLabel={data.summary.leadingDivisionName || "Leading division"}
                            centerValue={formatPercent(data.summary.leadingDivisionShare)}
                            data={mixSlices}
                            donutSize="large"
                        />
                        <Analytics10
                            title="Training Pending by Division"
                            description="Divisions ranked by admins still on .STAGE. Count with share of onboarded."
                            items={pendingRows}
                            metrics={[
                                { id: "pendingCount", label: "Pending count", format: "number" },
                            ]}
                            secondaryMetric={{
                                id: "pendingRate",
                                label: "Pending %",
                                format: "percent",
                            }}
                            pageSize={8}
                            emptyMessage="No division onboarding data yet."
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                        <Analytics10
                            title="AOV and Revenue per Company"
                            description="Ranked dollar metrics per division. Toggle between average order value and roster yield."
                            items={rankedItems}
                            metrics={[
                                { id: "aov", label: "AOV" },
                                { id: "revPerCompany", label: "Rev / company" },
                            ]}
                        />
                        <ChartBarNegative
                            title="Period Growth by Division"
                            description="Signed revenue change versus the prior period of the same length."
                            data={growthBars}
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <ChartBarMultiple
                            title="Revenue vs Accounts"
                            description="Period revenue and roster companies by division."
                            data={accountBars}
                            revenueLabel="Revenue"
                            countLabel="Accounts"
                        />
                    </div>
                </>
            ) : null}
        </div>
    );
};
