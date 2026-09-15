import { cn } from "@/lib/utils"

type TeamCreditProps = {
  className?: string
}

/** Quiet enterprise attribution — visible, never competing with content. */
export function TeamCredit({ className }: TeamCreditProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground/65 text-[11px] leading-none",
        className
      )}
    >
      Developed by{" "}
      <span className="text-muted-foreground/90 font-medium">
        Digital Solutions
      </span>
    </p>
  )
}
