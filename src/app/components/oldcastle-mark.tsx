import { cn } from "@/lib/utils"

type OldcastleMarkProps = {
  className?: string
  alt?: string
}

/** Official Oldcastle APG Castlemark (from brand portal assets). */
export function OldcastleMark({
  className,
  alt = "Oldcastle APG",
}: OldcastleMarkProps) {
  return (
    <img
      src="/brand/castlemark-transparent.png"
      alt={alt}
      className={cn("size-9 shrink-0 object-contain", className)}
    />
  )
}
