import { useLocation } from "react-router-dom";
import { useEffect } from "react";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

/** Official BigCommerce “B” mark from the press kit, tinted via currentColor. */
function BigCommerceBMark({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 40 40"
            fill="currentColor"
            aria-hidden="true"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M39.4908 0.0878779L24.576 14.9755H27.0084C30.8212 14.9755 33.0648 17.3635 33.0648 19.9875C33.0648 22.0411 31.6732 23.5547 30.2028 24.2152C29.966 24.3212 29.9744 24.6448 30.216 24.74C31.9288 25.4144 33.1628 27.2088 33.1628 29.3052C33.1628 32.2836 31.1816 34.6428 27.3392 34.6428H16.7732C16.6072 34.6428 16.4728 34.5104 16.4728 34.3476V23.0639L0.103148 39.4036C-0.116852 39.6232 0.0383482 40 0.349149 40H39.732C39.8804 40 40 39.8796 40 39.7312V0.299879C40 0.0334777 39.6792 -0.100123 39.4908 0.0878779ZM21.0356 30.9564H26.2584C27.8492 30.9564 28.8096 30.1308 28.8096 28.7156C28.8096 27.478 27.91 26.4744 26.2584 26.4744H21.0356C20.8696 26.4744 20.7352 26.6064 20.7352 26.7696V30.6612C20.7352 30.8244 20.8696 30.9564 21.0356 30.9564ZM20.7352 22.4939V18.9559C20.7352 18.7931 20.8696 18.6607 21.0356 18.6607H26.0784C27.5192 18.6607 28.4196 19.5155 28.4196 20.7247C28.4196 21.9923 27.5192 22.7887 26.0784 22.7887H21.0356C20.8696 22.7887 20.7352 22.6567 20.7352 22.4939Z"
            />
        </svg>
    );
}

export const Topbar = () => {
    const { pathname } = useLocation();
    const { setOpenMobile } = useSidebar();

    useEffect(() => {
        setOpenMobile(false);
    }, [pathname, setOpenMobile]);

    return (
        <header className="bg-background/80 sticky top-0 z-50 grid h-14 grid-cols-3 items-center overflow-hidden border-b backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger />
            </div>
            <img
                src="/brand/logo-horiz-color.png"
                alt="Oldcastle APG"
                className="h-7 w-auto max-h-7 justify-self-center object-contain"
            />
            <p className="text-muted-foreground flex items-center justify-self-end gap-1.5 px-4 text-xs">
                Data pulled from BigCommerce
                <BigCommerceBMark className="size-3.5 shrink-0" />
            </p>
        </header>
    );
};
