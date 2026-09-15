import type { CSSProperties, ReactNode } from "react";

import { DemoAdminSidebar } from "@/components/templates/ultimate-dashboard/layouts/sidebar";
import { Topbar } from "@/components/templates/ultimate-dashboard/layouts/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const AdminLayout = ({ children }: { children: ReactNode }) => {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "250px",
                } as CSSProperties
            }>
            <DemoAdminSidebar />
            <SidebarInset>
                <Topbar />
                <div className="flex flex-1 flex-col p-4 sm:p-5">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
};
