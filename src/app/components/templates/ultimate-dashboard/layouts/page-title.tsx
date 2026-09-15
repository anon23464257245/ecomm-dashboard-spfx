import { Link } from "react-router-dom";
import { Fragment, type ReactNode } from "react";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PageDateRange } from "@/components/templates/ultimate-dashboard/layouts/page-date-range";

type Props = {
    title: string;
    endContent?: ReactNode;
    links?: {
        label: string;
        href: string;
    }[];
};

export const PageTitle = ({ title, endContent, links }: Props) => {
    const trailing =
        endContent ??
        (links ? (
            <Breadcrumb className="max-sm:hidden">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link to="/">Business View</Link>}></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {links.map((link, index) => (
                        <Fragment key={index}>
                            <BreadcrumbItem>
                                <BreadcrumbLink render={<Link to={link.href}>{link.label}</Link>}></BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        </Fragment>
                    ))}
                    <BreadcrumbItem>
                        <BreadcrumbPage>{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        ) : (
            <div className="min-w-0 shrink-0">
                <PageDateRange />
            </div>
        ));

    return (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 overflow-visible">
            <p className="min-w-0 text-lg font-medium sm:text-xl">{title}</p>
            {trailing}
        </div>
    );
};
