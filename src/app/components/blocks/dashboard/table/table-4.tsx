import { Fragment, useEffect, useMemo, useState } from "react";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { SearchIcon, XIcon } from "lucide-react";

import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { KpiInfoTooltip } from "@/components/blocks/dashboard/stat/kpi-info-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type Table4Customer = {
    id: string;
    name: string;
    division: string;
    revenue: number;
    orderCount: number;
    lastOrder: string | null;
    share: number;
    trainingStatus?: string | null;
};

const defaultCustomers: Table4Customer[] = [
    {
        id: "4819",
        name: "Pacific Stoneworks",
        division: "West",
        revenue: 412800,
        orderCount: 18,
        lastOrder: "2026-07-22",
        share: 8.4,
    },
    {
        id: "4820",
        name: "Summit Masonry",
        division: "Southeast",
        revenue: 286410,
        orderCount: 11,
        lastOrder: "2026-07-18",
        share: 5.8,
    },
    {
        id: "4821",
        name: "Lakeside Hardscapes",
        division: "Midwest",
        revenue: 194220,
        orderCount: 9,
        lastOrder: "2026-06-30",
        share: 3.9,
    },
    {
        id: "4822",
        name: "Harbor Precast",
        division: "Northeast",
        revenue: 151670,
        orderCount: 7,
        lastOrder: "2026-07-11",
        share: 3.1,
    },
    {
        id: "4823",
        name: "Northland Pavers",
        division: "Canada",
        revenue: 0,
        orderCount: 0,
        lastOrder: null,
        share: 0,
        trainingStatus: "pending",
    },
];

export type Table4Props = {
    title?: string;
    description?: string;
    tooltip?: string;
    customers?: Table4Customer[];
    searchPlaceholder?: string;
    emptyMessage?: string;
    defaultPageSize?: number;
};

function awaitingAccessLabel(status?: string | null) {
    if (status === "pending") return "Training pending — not yet buying";
    if (status === "no_admin") return "No admin yet — not yet buying";
    return "Awaiting access — not yet buying";
}

function isAwaitingAccess(row: Table4Customer) {
    if ((row.orderCount ?? 0) > 0) return false;
    return row.trainingStatus === "pending" || row.trainingStatus === "no_admin";
}

function formatLastOrder(value: string | null) {
    if (!value) return "—";
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function pageList(current: number, total: number) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index);
    const pages = new Set([0, total - 1, current - 1, current, current + 1]);
    return [...pages].filter((page) => page >= 0 && page < total).sort((a, b) => a - b);
}

export const Table4 = ({
    title = "Account Directory",
    description = "Searchable roster of accounts with orders in this period, ranked by revenue.",
    tooltip,
    customers,
    searchPlaceholder = "Search accounts…",
    emptyMessage = "No buyers with orders in this period.",
    defaultPageSize = 10,
}: Table4Props) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [divisionFilter, setDivisionFilter] = useState("all");
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });

    const rows = customers ?? defaultCustomers;
    const query = searchQuery.trim().toLowerCase();
    const divisions = useMemo(() => {
        return [...new Set(rows.map((row) => row.division).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    }, [rows]);

    const filtered = useMemo(() => {
        return rows.filter((row) => {
            const matchesSearch =
                !query ||
                row.name.toLowerCase().includes(query) ||
                row.division.toLowerCase().includes(query) ||
                row.id.toLowerCase().includes(query);
            const matchesDivision = divisionFilter === "all" || row.division === divisionFilter;
            return matchesSearch && matchesDivision;
        });
    }, [divisionFilter, query, rows]);

    const columns = useMemo<ColumnDef<Table4Customer>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Account",
                cell: ({ row }) => (
                    <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-medium">{row.original.name}</span>
                        {isAwaitingAccess(row.original) ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <button
                                            type="button"
                                            aria-label={awaitingAccessLabel(row.original.trainingStatus)}
                                            className="inline-flex size-2 shrink-0 rounded-full bg-[color:var(--brand-bright)] outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                                        />
                                    }
                                />
                                <TooltipContent side="top" className="max-w-56 text-xs">
                                    {awaitingAccessLabel(row.original.trainingStatus)}
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </span>
                ),
            },
            {
                accessorKey: "division",
                header: "Division",
                cell: ({ row }) => (
                    <span className="text-muted-foreground block truncate">{row.original.division || "—"}</span>
                ),
            },
            {
                accessorKey: "revenue",
                header: () => <div className="text-right">Revenue</div>,
                cell: ({ row }) => (
                    <div className="font-stat text-right tabular-nums">{formatCurrency(row.original.revenue)}</div>
                ),
            },
            {
                accessorKey: "orderCount",
                header: () => <div className="text-right">Orders</div>,
                cell: ({ row }) => (
                    <div className="text-right tabular-nums">{formatNumber(row.original.orderCount)}</div>
                ),
            },
            {
                accessorKey: "lastOrder",
                header: () => <div className="text-right">Last Order</div>,
                cell: ({ row }) => (
                    <div className="text-muted-foreground whitespace-nowrap text-right">
                        {formatLastOrder(row.original.lastOrder)}
                    </div>
                ),
            },
            {
                accessorKey: "share",
                header: () => <div className="pr-3 text-right">Share</div>,
                cell: ({ row }) => (
                    <div className="pr-3 text-right tabular-nums">{formatPercent(row.original.share)}</div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: filtered,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        state: { pagination },
    });

    useEffect(() => {
        setSearchQuery("");
        setDivisionFilter("all");
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }, [customers]);

    const isFiltered = query !== "" || divisionFilter !== "all";
    const pageIndex = pagination.pageIndex;
    const pageSize = pagination.pageSize;
    const totalRecords = filtered.length;
    const startIndex = totalRecords === 0 ? 0 : pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const totalPages = table.getPageCount();
    const pages = pageList(pageIndex, totalPages);

    function resetFilters() {
        setSearchQuery("");
        setDivisionFilter("all");
        table.setPageIndex(0);
    }

    return (
        <Card className="gap-3 pb-2 max-md:py-4!">
            <CardHeader className="flex flex-col gap-4 max-md:px-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <CardTitle>{title}</CardTitle>
                        {tooltip ? <KpiInfoTooltip label={title} text={tooltip} /> : null}
                    </div>
                    {description ? <CardDescription>{description}</CardDescription> : null}
                </div>
                <CardAction className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-64">
                        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                                table.setPageIndex(0);
                            }}
                            className="pl-9"
                        />
                    </div>
                    {divisions.length > 1 ? (
                        <Select
                            value={divisionFilter}
                            onValueChange={(value) => {
                                if (!value) return;
                                setDivisionFilter(value);
                                table.setPageIndex(0);
                            }}
                        >
                            <SelectTrigger className="w-full cursor-pointer sm:w-44">
                                <SelectValue placeholder="Division" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="cursor-pointer">
                                    All divisions
                                </SelectItem>
                                {divisions.map((division) => (
                                    <SelectItem key={division} value={division} className="cursor-pointer">
                                        {division}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : null}
                    {isFiltered ? (
                        <Button variant="ghost" onClick={resetFilters} className="h-9 gap-1.5 px-3">
                            <XIcon className="size-4" />
                            Clear
                        </Button>
                    ) : null}
                </CardAction>
            </CardHeader>
            <CardContent className="max-md:px-4">
                <div className="overflow-auto">
                    <Table className="table-fixed">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="bg-muted/60">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                header.column.id === "name" && "w-[28%]",
                                                header.column.id === "division" && "w-[16%]",
                                                header.column.id === "revenue" && "w-[16%]",
                                                header.column.id === "orderCount" && "w-[12%]",
                                                header.column.id === "lastOrder" && "w-[16%]",
                                                header.column.id === "share" && "w-[12%]"
                                            )}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} className="h-10 [&>td]:h-10 [&>td]:py-1 [&>td]:align-middle">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="max-w-0">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-muted-foreground text-xs max-sm:hidden">
                        {totalRecords === 0
                            ? emptyMessage
                            : `Showing ${startIndex + 1}–${endIndex} of ${totalRecords} accounts`}
                    </p>
                    {totalPages > 1 ? (
                        <Pagination className="mx-0 w-auto justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            table.previousPage();
                                        }}
                                        className={
                                            !table.getCanPreviousPage()
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                                {pages.map((page, index) => {
                                    const previous = pages[index - 1];
                                    return (
                                        <Fragment key={page}>
                                            {previous != null && page - previous > 1 ? (
                                                <PaginationItem>
                                                    <span className="text-muted-foreground px-1 text-xs">…</span>
                                                </PaginationItem>
                                            ) : null}
                                            <PaginationItem>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={page === pageIndex}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        table.setPageIndex(page);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    {page + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </Fragment>
                                    );
                                })}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            table.nextPage();
                                        }}
                                        className={
                                            !table.getCanNextPage()
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
};
