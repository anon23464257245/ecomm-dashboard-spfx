import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { PaceuiErrorBoundary } from "@/components/templates/ultimate-dashboard/layouts/paceui-error-boundary"

const THEME_CLASS = "paceui-default"

/**
 * Applies stock shadcn zinc tokens on <html> for the PaceUI app shell.
 * Portals (dropdowns, sheets, dialogs) render on document.body, so the class
 * has to live on the document element — a wrapper div would not cover them.
 */
export function PaceuiDefaultTheme() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add(THEME_CLASS)
    return () => {
      root.classList.remove(THEME_CLASS)
    }
  }, [])

  return (
    <PaceuiErrorBoundary
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Something went wrong loading this page. Refresh to try again.
        </div>
      }
    >
      <Outlet />
    </PaceuiErrorBoundary>
  )
}
