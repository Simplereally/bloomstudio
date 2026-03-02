import { type ModelDefinition, isMonochromeLogo } from "@/lib/config/models";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { NsfwBadge } from "./nsfw-badge";

export function ModelBadge({
  model,
  showNsfw,
}: {
  model: ModelDefinition;
  /** When true, shows 18+ badge if this model supports unrestricted generation */
  showNsfw?: boolean;
}) {
  return (
    <div className="group relative flex items-center gap-3 p-2 px-4 rounded-xl bg-white/[0.03] border border-white/5 transition-all duration-300 overflow-hidden hover:border-primary/50 hover:bg-white/[0.06]" role="listitem">
      {model.logo ? (
        <div className="relative w-5 h-5">
          <Image src={model.logo} alt={`${model.displayName} logo`} fill sizes="20px" className={cn("object-contain", isMonochromeLogo(model.logo) && "dark:invert")} />
        </div>
      ) : (
        <Sparkles className="h-4 w-4 text-primary" />
      )}
      <span className="text-[13px] font-bold font-brand text-foreground uppercase tracking-tight">
        {model.displayName}
      </span>

      {showNsfw && model.isUnrestricted && <NsfwBadge />}
    </div>
  );
}
