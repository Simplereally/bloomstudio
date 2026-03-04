import { type ModelDefinition, isMonochromeLogo } from "@/lib/config/models";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { AlphaBadge } from "./alpha-badge";
import { NsfwBadge } from "./nsfw-badge";

export function ModelBadge({
  model,
  showNsfw,
}: {
  model: ModelDefinition;
  /** When true, shows 18+ badge if this model supports unrestricted generation */
  showNsfw?: boolean;
}) {
  const isAlpha = model.modelPricing?.isAlpha === true;
  const isUnrestricted = showNsfw && model.isUnrestricted;

  return (
    <div className="group relative flex items-center gap-2 p-2 px-3 sm:p-2 sm:px-4 rounded-xl bg-white/[0.03] border border-white/5 transition-all duration-300 overflow-hidden hover:border-primary/50 hover:bg-white/[0.06]" role="listitem">
      {model.logo ? (
        <div className="relative w-5 h-5 flex-shrink-0">
          <Image src={model.logo} alt={`${model.displayName} logo`} fill sizes="20px" className={cn("object-contain", isMonochromeLogo(model.logo) && "dark:invert")} />
        </div>
      ) : (
        <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
      )}
      <span className="text-[12px] sm:text-[13px] font-bold font-brand text-foreground uppercase tracking-tight truncate min-w-0 max-w-[120px] sm:max-w-[180px]">
        {model.displayName}
      </span>

      {(isAlpha || isUnrestricted) && (
        <div className="flex shrink-0 items-center gap-1.5 ml-1">
          {isAlpha && isUnrestricted ? (
            <div className="relative inline-flex shrink-0 items-stretch overflow-hidden rounded-[7px] p-[1px] bg-gradient-to-r from-amber-500/30 via-white/10 to-pink-500/30 shadow-sm transition-all duration-300 group-hover:from-amber-500/50 group-hover:to-pink-500/50">
              <div className="flex items-stretch overflow-hidden rounded-[6px] bg-[#0A0A0A]/90 backdrop-blur-md">
                <span className="flex items-center justify-center bg-amber-500/15 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase leading-none tracking-wider text-amber-400">
                  Alpha
                </span>
                <div className="w-[1px] bg-white/10" />
                <span className="flex items-center justify-center bg-pink-600/15 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase leading-none tracking-wider text-pink-400">
                  18+
                </span>
              </div>
            </div>
          ) : (
            <>
              {isAlpha && <AlphaBadge />}
              {isUnrestricted && <NsfwBadge />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
