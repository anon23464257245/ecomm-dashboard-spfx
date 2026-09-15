import {
  FileDownIcon,
  ListFilterIcon,
  MoreHorizontalIcon,
  NotepadTextIcon,
  WarehouseIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/format"
import { productBrandColor } from "@/lib/chart-fills"

export type Table3Product = {
  id: string
  name: string
  sku: string
  category: string
  sales: number
  orders?: number
  revenue: number
  status?: "in-stock" | "low-stock" | "out-of-stock" | "active"
}

const defaultProducts: Table3Product[] = [
  {
    id: "PROD-001",
    name: "Wireless Noise-Canceling Headphones",
    sku: "WLNCH",
    category: "Electronics",
    sales: 1240,
    revenue: 370760,
    status: "in-stock",
  },
  {
    id: "PROD-002",
    name: "Ergonomic Office Chair",
    sku: "ERGOC",
    category: "Furniture",
    sales: 850,
    revenue: 127500,
    status: "low-stock",
  },
  {
    id: "PROD-003",
    name: "Mechanical Gaming Keyboard",
    sku: "MECHGK",
    category: "Electronics",
    sales: 600,
    revenue: 53994,
    status: "in-stock",
  },
  {
    id: "PROD-004",
    name: "Smartphone Stand",
    sku: "SPST",
    category: "Accessories",
    sales: 450,
    revenue: 8995,
    status: "out-of-stock",
  },
  {
    id: "PROD-005",
    name: "4K Monitor 27-inch",
    sku: "Moni-4K",
    category: "Electronics",
    sales: 320,
    revenue: 127680,
    status: "in-stock",
  },
]

export type Table3Props = {
  title?: string
  description?: string
  products?: Table3Product[]
  limit?: number
  categoryLabel?: string
  countLabel?: string
  showActions?: boolean
  showSku?: boolean
  /** Show a brand-color swatch before the category badge (product brand tables). */
  showBrandSwatch?: boolean
  rowClassName?: string
}

export const Table3 = ({
  title = "Top Selling Products",
  description = "Your highest performing products for this month.",
  products,
  limit = 5,
  categoryLabel = "Brand",
  countLabel = "Orders",
  showActions = true,
  showSku = true,
  showBrandSwatch = false,
  rowClassName,
}: Table3Props) => {
  const rows = (products ?? defaultProducts).slice(0, limit)
  const showOrders = rows.some((product) => product.orders != null)

  return (
    <Card className="h-full w-full gap-5 pb-5 max-md:py-4!">
      <CardHeader className="max-md:px-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {showActions ? (
        <CardAction>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Filter"
              className="max-md:hidden"
            >
              <ListFilterIcon className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="icon-sm" variant="outline" aria-label="Menu">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <NotepadTextIcon className="size-4" />
                    View Report
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <WarehouseIcon className="size-4" />
                    Manage Inventory
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <FileDownIcon className="size-4" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1 max-md:px-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="min-w-0">Name</TableHead>
              <TableHead className="w-px whitespace-nowrap">{categoryLabel}</TableHead>
              <TableHead className="w-px pr-4 text-right whitespace-nowrap">{countLabel}</TableHead>
              {showOrders ? (
                <TableHead className="w-px pr-4 text-right whitespace-nowrap">Orders</TableHead>
              ) : null}
              <TableHead className="w-px pl-5 text-right whitespace-nowrap">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((product) => (
              <TableRow key={product.id} className={rowClassName}>
                <TableCell className="min-w-0 whitespace-normal align-middle">
                  <div className="flex h-8 min-w-0 flex-col justify-center overflow-hidden">
                    <p className="truncate font-medium">{product.name}</p>
                    {showSku ? (
                      <p className="text-muted-foreground truncate text-xs leading-4">{product.sku}</p>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell className="w-px align-middle whitespace-nowrap">
                  <Badge variant="secondary" className="gap-1.5 whitespace-nowrap">
                    {showBrandSwatch ? (
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            productBrandColor(product.category) ??
                            "var(--muted-foreground)",
                        }}
                        aria-hidden
                      />
                    ) : null}
                    {product.category}
                  </Badge>
                </TableCell>

                <TableCell className="font-stat w-px pr-4 text-right align-middle whitespace-nowrap">
                  {formatNumber(product.sales)}
                </TableCell>

                {showOrders ? (
                  <TableCell className="font-stat w-px pr-4 text-right align-middle whitespace-nowrap">
                    {formatNumber(product.orders ?? 0)}
                  </TableCell>
                ) : null}

                <TableCell className="font-stat w-px pl-5 text-right align-middle whitespace-nowrap">
                  {formatCurrency(product.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
