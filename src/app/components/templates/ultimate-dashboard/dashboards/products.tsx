import { useMemo } from "react";

import { AlertCircleIcon } from "lucide-react";

import { Analytics5, type Analytics5Slice } from "@/components/blocks/app/analytics/analytics-5";
import { ChartBarMultiple } from "@/components/blocks/dashboard/chart/chart-bar-multiple";
import { ChartCumulative } from "@/components/blocks/dashboard/chart/chart-cumulative";
import { Stat9 } from "@/components/blocks/dashboard/stat/stat-9";
import { Table3, type Table3Product } from "@/components/blocks/dashboard/table/table-3";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncData } from "@/hooks/use-async-data";
import { useDashboardDateFilters } from "@/hooks/use-dashboard-date-filters";
import { api, type Comparison, type ProductDashboard as ProductDashboardData } from "@/lib/api";
import { formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { chartFillForLabel } from "@/lib/chart-fills";
import { PageTitle } from "@/components/templates/ultimate-dashboard/layouts/page-title";

function kpiChange(comparison: Comparison | undefined) {
    const percent = comparison?.percentChange ?? 0;
    return {
        changeText: `${Math.abs(percent).toFixed(1)}%`,
        changeType: (percent >= 0 ? "up" : "down") as "up" | "down",
        helperText: comparison ? "vs. prior period" : "In this period",
    };
}

function toBrandSlices(data: ProductDashboardData): Analytics5Slice[] {
    const rows = data.brandComposition ?? data.brandMix;
    return rows.map((row, index) => {
        const children =
            "children" in row && Array.isArray(row.children)
                ? row.children.map((child, childIndex) => ({
                      id: `${child.label}-${childIndex}`,
                      label: child.label,
                      value: child.value,
                      fill: chartFillForLabel(child.label, childIndex),
                  }))
                : undefined;

        return {
            id: `${row.label}-${index}`,
            label: row.label,
            value: row.value,
            fill: chartFillForLabel(row.label, index),
            children,
        };
    });
}

function toProductRows(data: ProductDashboardData): Table3Product[] {
    return data.topProducts.map((product) => ({
        id: String(product.product_id),
        name: product.product_name,
        sku: product.sku || "",
        category: product.brand || "—",
        sales: product.unitsSold,
        orders: product.orderCount,
        revenue: product.revenue,
    }));
}

function ProductsLoading() {
    return (
        <>
            <Card className="mt-4 p-0 sm:mt-5">
                <div className="bg-border grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, index) => (
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
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="mt-6 h-48 w-full" />
                </Card>
            </div>
            <Card className="mt-4 space-y-3 p-4 sm:mt-5 sm:p-5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="mt-6 h-56 w-full" />
            </Card>
            <Card className="mt-4 space-y-3 p-4 sm:mt-5 sm:p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-64 w-full" />
            </Card>
        </>
    );
}

export const ProductDashboard = () => {
    const { from, to } = useDashboardDateFilters();
    const { data, error, loading } = useAsyncData(
        () => api.products({ from, to }),
        [from, to]
    );

    const kpis = useMemo(() => {
        if (!data) return [];
        const comparisons = data.comparisons;
        return [
            {
                id: "units-sold",
                label: "Units Sold",
                value: formatNumber(data.summary.unitsSold),
                description: "Sum of line quantities on orders in the selected period.",
                ...kpiChange(comparisons?.unitsSold),
            },
            {
                id: "unique-skus",
                label: "Unique SKUs",
                value: formatNumber(data.summary.uniqueProducts),
                description: "Distinct product IDs with at least one unit sold in the period.",
                ...kpiChange(comparisons?.uniqueProducts),
            },
            {
                id: "brands-sold",
                label: "Brands Sold",
                value: formatNumber(data.summary.brandCount),
                description: "Distinct brands on sold lines in the selected period.",
                ...kpiChange(comparisons?.brandCount),
            },
            {
                id: "units-per-sku",
                label: "Units / SKU",
                value: formatDecimal(data.summary.unitsPerSku),
                description: "Units sold divided by unique SKUs in the selected period.",
                ...kpiChange(comparisons?.unitsPerSku),
            },
            {
                id: "units-per-order",
                label: "Units / Order",
                value: formatDecimal(data.summary.unitsPerOrder),
                description: "Units sold divided by orders that contain product lines.",
                ...kpiChange(comparisons?.unitsPerOrder),
            },
            {
                id: "skus-to-80",
                label: "SKUs to 80%",
                value: formatNumber(data.summary.skusTo80 ?? 0),
                description: "How many SKUs, ranked by allocated revenue, cover 80% of product dollars.",
                ...kpiChange(comparisons?.skusTo80),
            },
        ];
    }, [data]);

    const brandSlices = useMemo(() => (data ? toBrandSlices(data) : []), [data]);
    const productRows = useMemo(() => (data ? toProductRows(data) : []), [data]);
    const paretoPoints = data?.skuPareto?.points ?? [];
    const brandBars = useMemo(
        () =>
            (data?.topBrands ?? []).slice(0, 8).map((brand) => ({
                name: brand.brand || "Unknown",
                revenue: brand.revenue,
                units: brand.unitsSold,
            })),
        [data]
    );

    return (
        <div className="@container/board min-w-0">
            <PageTitle title="Products" />

            {error ? (
                <Alert variant="destructive" className="mt-4 sm:mt-5">
                    <AlertCircleIcon />
                    <AlertTitle>Couldn’t load products</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {loading && !data ? <ProductsLoading /> : null}

            {data ? (
                <>
                    <div className="mt-4 sm:mt-5">
                        <Stat9 stats={kpis} valueClassName="font-stat" />
                    </div>

                    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 sm:mt-5 sm:gap-5 @min-[48rem]/board:grid-cols-2">
                        <Analytics5
                            title="Brand Mix"
                            description="Allocated product dollars by brand. Center is the leading brand share."
                            centerLabel={data.summary.leadingBrandName || "Leading brand"}
                            centerValue={formatPercent(data.summary.leadingBrandShare)}
                            data={brandSlices}
                        />
                        <ChartCumulative
                            title="SKU Pareto"
                            description="Cumulative allocated revenue as SKUs are ranked highest to lowest."
                            data={paretoPoints}
                            rankFor80={data.skuPareto?.rankFor80}
                            totalCount={data.skuPareto?.totalSkus}
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <ChartBarMultiple
                            title="Brand Revenue vs Units"
                            description="Allocated revenue and units sold for the top brands."
                            data={brandBars}
                        />
                    </div>

                    <div className="mt-4 sm:mt-5">
                        <Table3
                            title="Top Products"
                            description="Highest allocated-revenue SKUs in the selected period."
                            products={productRows}
                            limit={10}
                            categoryLabel="Brand"
                            countLabel="Units"
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
