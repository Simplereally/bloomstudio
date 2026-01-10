import { MODEL_REGISTRY } from "@/lib/config/models";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import Image from "next/image";

export function ModelBadge({ model }: { model: (typeof MODEL_REGISTRY)[string] }) {
  const isMonochrome = model.logo?.includes("openai.svg") || model.logo?.includes("flux.svg");

  return (
    <div className="group relative flex items-center gap-3 p-2 px-4 rounded-xl bg-white/[0.03] border border-white/5 transition-all duration-300 overflow-hidden hover:border-primary/50 hover:bg-white/[0.06]">
      {model.logo ? (
        <div className="relative w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity">
          <Image src={model.logo} alt={`${model.displayName} logo`} fill className={cn("object-contain", isMonochrome && "dark:invert")} />
        </div>
      ) : (
        <Sparkles className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
      )}
      <span className="text-[13px] font-bold font-brand text-foreground/70 group-hover:text-foreground transition-colors uppercase tracking-tight">
        {model.displayName}
      </span>
    </div>
  );
}
