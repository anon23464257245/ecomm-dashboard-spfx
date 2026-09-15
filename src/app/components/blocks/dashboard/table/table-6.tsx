import { useState } from "react";

import {
    DatabaseIcon,
    MoreHorizontalIcon,
    PlayIcon,
    RefreshCwIcon,
    SearchIcon,
    StopCircleIcon,
    TrashIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

interface DatabaseInstance {
    id: string;
    name: string;
    engine: string;
    qps: string;
    latency: string;
    connections: number;
    nodesActive: number;
    nodesTotal: number;
    size: string;
    status: "Active" | "Syncing" | "Degraded";
    dateCreated: string;
}

const mockDatabases: DatabaseInstance[] = [
    {
        id: "1",
        name: "transactions-db",
        engine: "PostgreSQL",
        qps: "8.2k/s",
        latency: "1.2ms",
        connections: 845,
        nodesActive: 3,
        nodesTotal: 3,
        size: "9.8 GB",
        status: "Active",
        dateCreated: "04-12-2026",
    },
    {
        id: "2",
        name: "users-primary",
        engine: "PostgreSQL",
        qps: "2.4k/s",
        latency: "0.8ms",
        connections: 124,
        nodesActive: 3,
        nodesTotal: 3,
        size: "240 MB",
        status: "Active",
        dateCreated: "03-24-2026",
    },
    {
        id: "3",
        name: "logs-archive",
        engine: "ClickHouse",
        qps: "15.4k/s",
        latency: "12.4ms",
        connections: 2400,
        nodesActive: 3,
        nodesTotal: 3,
        size: "24.5 GB",
        status: "Active",
        dateCreated: "05-01-2026",
    },
    {
        id: "4",
        name: "cache-redis",
        engine: "Redis",
        qps: "120k/s",
        latency: "0.1ms",
        connections: 1500,
        nodesActive: 1,
        nodesTotal: 2,
        size: "45 MB",
        status: "Syncing",
        dateCreated: "02-15-2026",
    },
    {
        id: "5",
        name: "sessions-store",
        engine: "MongoDB",
        qps: "450/s",
        latency: "4.2ms",
        connections: 92,
        nodesActive: 2,
        nodesTotal: 3,
        size: "12 MB",
        status: "Degraded",
        dateCreated: "06-08-2026",
    },
];

export type Table6StateRow = {
    id: string;
    name: string;
    companies: number;
    orders: number;
    revenue: number;
    share: number;
};

export type Table6Props = {
    title?: string;
    description?: string;
    rows?: Table6StateRow[];
    searchPlaceholder?: string;
    emptyMessage?: string;
};

export const Table6 = ({
    title,
    description,
    rows,
    searchPlaceholder,
    emptyMessage,
}: Table6Props = {}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const filteredDatabases = mockDatabases.filter(
        (db) =>
            db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            db.engine.toLowerCase().includes(searchQuery.toLowerCase()) ||
            db.status.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const isAllSelected = filteredDatabases.length > 0 && selectedIds.length === filteredDatabases.length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredDatabases.map((db) => db.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
    };

    if (rows) {
        const filteredRows = rows.filter((row) =>
            row.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        return (
            <Card className="gap-4 pb-3">
                <CardHeader className="flex flex-col gap-4 max-md:px-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-0.5">
                        <CardTitle className="text-base font-medium">{title ?? "Top States"}</CardTitle>
                        <span className="text-muted-foreground text-xs">
                            {description ?? "Companies, orders, and revenue by state"}
                        </span>
                    </div>
                    <InputGroup className="w-40 2xl:w-64">
                        <InputGroupAddon align="inline-start">
                            <SearchIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder={searchPlaceholder ?? "Search state…"}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </InputGroup>
                </CardHeader>
                <CardContent className="max-md:px-4">
                    <Table>
                        <TableHeader className="bg-muted/60">
                            <TableRow>
                                <TableHead>State</TableHead>
                                <TableHead className="text-right">Companies</TableHead>
                                <TableHead className="text-right">Orders</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">Share</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell className="font-stat text-right">
                                        {formatNumber(row.companies)}
                                    </TableCell>
                                    <TableCell className="font-stat text-right">{formatNumber(row.orders)}</TableCell>
                                    <TableCell className="font-stat text-right">
                                        {formatCurrency(row.revenue)}
                                    </TableCell>
                                    <TableCell className="font-stat text-right">{formatPercent(row.share)}</TableCell>
                                </TableRow>
                            ))}
                            {filteredRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                                        {emptyMessage ?? "No states found."}
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="gap-4 pb-3">
            <CardHeader className="flex flex-col gap-4 max-md:px-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    <div className="bg-muted flex size-8 items-center justify-center rounded-md">
                        <DatabaseIcon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <CardTitle className="text-base font-medium">Database Instances</CardTitle>
                        <span className="text-muted-foreground text-xs">
                            Active database clusters <span className="max-2xl:hidden">and performance metrics</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <InputGroup className="w-40 2xl:w-64">
                        <InputGroupAddon align="inline-start">
                            <SearchIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder="Search databases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </InputGroup>
                    <Button variant="outline" size="sm" className="cursor-pointer max-2xl:size-9">
                        <RefreshCwIcon className="size-4" />
                        <span className="max-2xl:hidden">Refresh</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="max-md:px-4">
                <Table>
                    <TableHeader className="bg-muted/60">
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(checked) => handleSelectAll(checked)}
                                />
                            </TableHead>
                            <TableHead>Database / Engine</TableHead>
                            <TableHead className="text-right">QPS</TableHead>
                            <TableHead className="text-right">Latency</TableHead>
                            <TableHead className="text-right">Connections</TableHead>
                            <TableHead>Node Status</TableHead>
                            <TableHead className="text-right">Storage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDatabases.map((db) => {
                            const isSelected = selectedIds.includes(db.id);
                            const isDegraded = db.status === "Degraded";
                            const isSyncing = db.status === "Syncing";

                            return (
                                <TableRow key={db.id} data-state={isSelected ? "selected" : undefined}>
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => handleSelectRow(db.id, checked)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium">{db.name}</span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-medium">{db.qps}</TableCell>
                                    <TableCell className="text-muted-foreground text-right font-mono text-xs">
                                        {db.latency}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-right font-mono text-xs">
                                        {db.connections.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: db.nodesTotal }).map((_, segment) => {
                                                    const isActive = segment < db.nodesActive;
                                                    return (
                                                        <div
                                                            key={segment}
                                                            className={`h-4.5 w-1 rounded-sm ${
                                                                isActive
                                                                    ? isDegraded
                                                                        ? "bg-destructive"
                                                                        : isSyncing
                                                                          ? "bg-primary"
                                                                          : "bg-green-500"
                                                                    : "bg-muted"
                                                            }`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <span className="text-muted-foreground text-xs font-medium">
                                                {db.nodesActive}/{db.nodesTotal}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs font-medium">
                                        {db.size}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                db.status === "Active"
                                                    ? "default"
                                                    : db.status === "Syncing"
                                                      ? "secondary"
                                                      : "destructive"
                                            }
                                            className="cursor-pointer">
                                            <span
                                                className={`me-1 size-1.5 rounded-sm ${
                                                    db.status === "Active"
                                                        ? "bg-primary-foreground"
                                                        : db.status === "Syncing"
                                                          ? "bg-primary"
                                                          : "bg-destructive"
                                                }`}
                                            />
                                            <span>{db.status}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                render={
                                                    <Button size="icon-xs" variant="ghost" aria-label="Actions">
                                                        <MoreHorizontalIcon className="size-4" />
                                                    </Button>
                                                }
                                            />
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <PlayIcon className="size-4" />
                                                        <span>Start Cluster</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <StopCircleIcon className="size-4" />
                                                        <span>Stop Cluster</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem variant="destructive" className="cursor-pointer">
                                                        <TrashIcon className="size-4" />
                                                        <span>Terminate</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredDatabases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-muted-foreground h-24 text-center">
                                    No databases found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
