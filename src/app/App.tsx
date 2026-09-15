import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "sonner"
import "@/app-fonts"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PaceuiDefaultTheme } from "@/components/paceui-default-theme"
import { PaceuiAdminLayout } from "@/pages/paceui-admin-layout"
import { ScoreboardDevDashboard } from "@/components/templates/ultimate-dashboard/dashboards/scoreboard-dev"
import { CustomerDashboard } from "@/components/templates/ultimate-dashboard/dashboards/customers"
import { ProductDashboard } from "@/components/templates/ultimate-dashboard/dashboards/products"
import { DivisionDashboard } from "@/components/templates/ultimate-dashboard/dashboards/divisions"
import { GeographyDashboard } from "@/components/templates/ultimate-dashboard/dashboards/geography"
import { setApiBaseUrl } from "@/lib/api-config"

export type AppProps = {
  /**
   * API origin for SPFx (property pane), e.g. `https://api.example.com`.
   * Leave empty for Vite same-origin `/api` proxy.
   */
  apiBaseUrl?: string
}

export default function App({ apiBaseUrl = "" }: AppProps) {
  // Module-level config so child fetches (including first paint) see the host URL.
  setApiBaseUrl(apiBaseUrl)

  return (
    <div className="apg-analytics-root">
      <TooltipProvider>
        <HashRouter>
          <Routes>
            <Route element={<PaceuiDefaultTheme />}>
              <Route element={<PaceuiAdminLayout />}>
                <Route index element={<ScoreboardDevDashboard />} />
                <Route path="dashboards/customers" element={<CustomerDashboard />} />
                <Route path="dashboards/products" element={<ProductDashboard />} />
                <Route path="dashboards/divisions" element={<DivisionDashboard />} />
                <Route path="dashboards/geography" element={<GeographyDashboard />} />
              </Route>

              {/* Legacy PaceUI prefix */}
              <Route path="paceui" element={<Navigate to="/" replace />} />
              <Route path="paceui/dev/scoreboard" element={<Navigate to="/" replace />} />
              <Route
                path="paceui/dashboards/customers"
                element={<Navigate to="/dashboards/customers" replace />}
              />
              <Route
                path="paceui/dashboards/products"
                element={<Navigate to="/dashboards/products" replace />}
              />
              <Route
                path="paceui/dashboards/divisions"
                element={<Navigate to="/dashboards/divisions" replace />}
              />
              <Route
                path="paceui/dashboards/geography"
                element={<Navigate to="/dashboards/geography" replace />}
              />
              <Route path="paceui/*" element={<Navigate to="/" replace />} />

              {/* Legacy AppShell paths */}
              <Route
                path="customers"
                element={<Navigate to="/dashboards/customers" replace />}
              />
              <Route
                path="customer-insights"
                element={<Navigate to="/dashboards/customers" replace />}
              />
              <Route
                path="products"
                element={<Navigate to="/dashboards/products" replace />}
              />
              <Route
                path="divisions"
                element={<Navigate to="/dashboards/divisions" replace />}
              />
              <Route
                path="geography"
                element={<Navigate to="/dashboards/geography" replace />}
              />
              <Route path="warehouses" element={<Navigate to="/" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster richColors position="top-right" />
        </HashRouter>
      </TooltipProvider>
    </div>
  )
}
