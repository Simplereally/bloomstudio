import { TooltipContent as BaseTooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import * as React from "react"

export { Tooltip, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export const RichTooltipContent = React.forwardRef<
  React.ElementRef<typeof BaseTooltipContent>,
  React.ComponentPropsWithoutRef<typeof BaseTooltipContent>
>(({ className, children, ...props }, ref) => (
  <BaseTooltipContent
    ref={ref}
    side="bottom"
    className={cn(
      // Base Layout & Colors (Matches AspectRatioSelector)
      "p-3 min-w-[180px] bg-popover border border-border dark:border-white/15 text-popover-foreground",
      
      // Shadow & Animation (Matches AspectRatioSelector + Zoom restored)
      "shadow-[0_20px_60px_0px_rgba(0,0,0,0.8)]",
      "animate-in fade-in-0 zoom-in-95 duration-200",
      
      // Fix: Hide the geometric arrow to prevent positioning jank during animation
      "[&>svg]:hidden", 
      
      className
    )}
    {...props}
  >
    {children}
  </BaseTooltipContent>
))
RichTooltipContent.displayName = "RichTooltipContent"
