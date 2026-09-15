import { Link } from "react-router-dom";

import { EyeIcon } from "lucide-react";

import { OldcastleMark } from "@/components/oldcastle-mark";
import { TeamCredit } from "@/components/team-credit";

import { demoAdminMenuItems } from "@/components/templates/ultimate-dashboard/layouts/items";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
} from "@/components/ui/sidebar";

import { NavItem } from "./nav-item";

export const DemoAdminSidebar = () => {
    return (
        <Sidebar>
            <SidebarHeader className="flex-row items-center px-4 py-4">
                <Link to="/" className="flex w-full cursor-pointer items-center gap-3">
                    <OldcastleMark className="h-10 w-10 rounded-md" />
                    <p className="flex min-w-0 flex-1 flex-col justify-center text-base leading-5">
                        <span className="truncate font-bold">B2B Analytics</span>
                        <span className="truncate font-normal">eCommerce</span>
                    </p>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu className="mt-2 mb-2 gap-0.5 px-2">
                    {demoAdminMenuItems.map((item, index) => (
                        <NavItem item={item} key={index} />
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <TeamCredit className="px-4 pb-2" />
            <SidebarFooter className="border-t px-2 py-1">
                <div className="flex items-center gap-2 px-2 py-3 text-sm leading-tight">
                    <EyeIcon className="size-[1em] shrink-0" aria-hidden />
                    <span className="truncate font-semibold">Business View</span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
};
