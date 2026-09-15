import { InfoIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function KpiInfoTooltip({ label, text }: { label: string; text: string }) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        aria-label={`About ${label}`}
                        className="text-muted-foreground hover:text-foreground inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-none outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                    >
                        <InfoIcon className="size-3.5" />
                    </button>
                }
            />
            <TooltipContent
                side="top"
                align="end"
                className="max-w-56 px-2.5 py-1.5 text-left leading-relaxed"
            >
                {text}
            </TooltipContent>
        </Tooltip>
    );
}
