import {
    type LucideIcon,
    GlobeIcon,
    LayersIcon,
    LayoutDashboardIcon,
    PackageIcon,
    UsersIcon,
} from "lucide-react";

export type MenuItem = {
    label: string;
    isTitle?: boolean;
    icon?: LucideIcon;
    href?: string;
    items?: MenuItem[];
    external?: boolean;
    tag?: "coming-soon" | "new" | "trend" | "pro";
};

/** App root — PaceUI is the default (and only) UI. */
export const prefix = "";

export const demoAdminMenuItems: MenuItem[] = [
    {
        label: "Dashboards",
        isTitle: true,
    },
    {
        label: "Scoreboard",
        icon: LayoutDashboardIcon,
        href: "/",
    },
    {
        label: "Customers",
        icon: UsersIcon,
        href: "/dashboards/customers",
    },
    {
        label: "Products",
        icon: PackageIcon,
        href: "/dashboards/products",
    },
    {
        label: "Divisions",
        icon: LayersIcon,
        href: "/dashboards/divisions",
    },
    {
        label: "Geography",
        icon: GlobeIcon,
        href: "/dashboards/geography",
    },
];
