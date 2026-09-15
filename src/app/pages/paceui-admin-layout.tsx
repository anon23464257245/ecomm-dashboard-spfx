import { Outlet } from "react-router-dom"
import { AdminLayout } from "@/components/templates/ultimate-dashboard/layouts"
import { PageDateRangeProvider } from "@/components/templates/ultimate-dashboard/layouts/page-date-range-context"

export function PaceuiAdminLayout() {
  return (
    <PageDateRangeProvider>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </PageDateRangeProvider>
  )
}
