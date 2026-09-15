import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"

import { ArrowRightIcon, CalendarDaysIcon, CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { PaceuiErrorBoundary } from "@/components/templates/ultimate-dashboard/layouts/paceui-error-boundary"
import {
  formatRangeDate,
  usePageDateRange,
  type DateRangeKey,
} from "@/components/templates/ultimate-dashboard/layouts/page-date-range-context"

const presets: { value: DateRangeKey; label: string }[] = [
  { value: "30d", label: "Last 30 Days" },
  { value: "month", label: "This Month" },
  { value: "mom", label: "MoM" },
  { value: "quarter", label: "This Quarter" },
  { value: "ytd", label: "Year to Date" },
  { value: "yoy", label: "YoY" },
  { value: "90d", label: "Last 90 Days" },
]

const dateBlockClass = cn(
  buttonVariants({ variant: "outline", size: "sm" }),
  "pointer-events-none max-w-full min-w-0"
)

const calendarClassNames = {
  root: "w-[15.75rem]",
  // Keep months relative so prev/next nav stays inside the calendar box.
  months: "relative flex w-[15.75rem] flex-col",
  month: "flex w-[15.75rem] flex-col gap-3",
  nav: "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
  button_previous: "size-8 p-0",
  button_next: "size-8 p-0",
  month_caption: "flex h-8 w-full items-center justify-center px-8",
  month_grid: "w-[15.75rem] border-separate border-spacing-0",
  weekdays: "flex w-[15.75rem]",
  weekday: "h-8 w-9 text-center text-[0.7rem] font-normal text-muted-foreground",
  week: "flex w-[15.75rem]",
  day: "h-9 w-9 p-0",
}

function placePanel(trigger: HTMLElement, panel: HTMLElement) {
  const rect = trigger.getBoundingClientRect()
  const gap = 8
  const vw = document.documentElement.clientWidth || window.innerWidth
  const vh = document.documentElement.clientHeight || window.innerHeight
  const pw = panel.offsetWidth || 420
  const ph = panel.offsetHeight || 360
  let top = rect.bottom + gap
  let left = rect.right - pw
  if (left < gap) left = gap
  if (left + pw > vw - gap) left = Math.max(gap, vw - pw - gap)
  if (top + ph > vh - gap) {
    const above = rect.top - ph - gap
    top = above >= gap ? above : Math.max(gap, vh - ph - gap)
  }
  const nextTop = `${Math.round(top)}px`
  const nextLeft = `${Math.round(left)}px`
  if (panel.style.top === nextTop && panel.style.left === nextLeft) return
  panel.style.top = nextTop
  panel.style.left = nextLeft
}

export const PageDateRange = () => {
  const { today, preset, range, month, handleMonthChange, applyPreset, selectRange } =
    usePageDateRange()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const disabled = useMemo(() => ({ after: today }), [today])
  const close = useCallback(() => setOpen(false), [])

  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    placePanel(trigger, panel)
    const frame = window.requestAnimationFrame(() => {
      if (triggerRef.current && panelRef.current) {
        placePanel(triggerRef.current, panelRef.current)
      }
    })
    const onResize = () => {
      if (triggerRef.current && panelRef.current) {
        placePanel(triggerRef.current, panelRef.current)
      }
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    const onOutside = (event: Event) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onOutside, true)
    }, 80)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onOutside, true)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex max-w-full min-w-0 flex-col items-end">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-none outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
      >
        <CalendarDaysIcon className="text-muted-foreground size-4 shrink-0" />
        <span className={dateBlockClass}>
          <span className="truncate">{formatRangeDate(range.from)}</span>
        </span>
        <ArrowRightIcon className="text-muted-foreground size-3.5 shrink-0" />
        <span className={cn(dateBlockClass, !range.to && "text-muted-foreground")}>
          <span className="truncate">{formatRangeDate(range.to)}</span>
        </span>
      </button>
      <PaceuiErrorBoundary key={open ? "open" : "closed"} fallback={null} onError={close}>
        {open ? (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Select date range"
            className="bg-popover text-popover-foreground fixed z-[80] w-max rounded-none shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
              <p className="text-xs font-medium">Date range</p>
              <button
                type="button"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}
                aria-label="Close date range"
                onClick={close}
              >
                <XIcon />
              </button>
            </div>
            <div className="flex flex-col-reverse sm:flex-row">
              <div className="grid min-w-0 grid-cols-2 gap-0.5 border-t bg-muted/50 p-2 sm:flex sm:w-40 sm:shrink-0 sm:flex-col sm:border-t-0 sm:border-r">
                {presets.map((item) => {
                  const active = preset === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={cn(
                        buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
                        "h-8 w-full justify-between px-2 font-normal"
                      )}
                      onClick={() => applyPreset(item.value)}
                    >
                      {item.label}
                      {active ? <CheckIcon className="size-3.5" /> : null}
                    </button>
                  )
                })}
              </div>
              <div className="flex shrink-0 flex-col p-3">
                <Calendar
                  mode="range"
                  numberOfMonths={1}
                  selected={range}
                  onSelect={selectRange}
                  month={month}
                  onMonthChange={handleMonthChange}
                  disabled={disabled}
                  autoFocus={false}
                  className="bg-transparent p-0 [--cell-size:2.25rem]"
                  classNames={calendarClassNames}
                />
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-3 h-8 self-end px-3")}
                  onClick={close}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PaceuiErrorBoundary>
    </div>
  )
}
