import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";
import { Sparkles, Check, X, Clock, Zap, DollarSign } from "lucide-react";

interface CompetitorData {
  name: string;
  monthlyPrice: number;
  generations: number;
  concurrent: string;
  queueLimit: string;
  waitTimes: string;
  isUs?: boolean;
}

const competitors: CompetitorData[] = [
  {
    name: "Bloom Studio",
    monthlyPrice: 5,
    generations: 900,
    concurrent: "10 generations a second (600 a minute!)",
    queueLimit: "1,000 generations",
    waitTimes: "No wait times",
    isUs: true,
  },
  {
    name: "Leonardo AI",
    monthlyPrice: 60,
    generations: 428,
    concurrent: "Only 6 concurrent",
    queueLimit: "Only 20 generations",
    waitTimes: "Long queue times",
  },
  {
    name: "Higgsfield",
    monthlyPrice: 29,
    generations: 300,
    concurrent: "Only 4 concurrent",
    queueLimit: "Limited",
    waitTimes: "Long queue times",
  },
  {
    name: "Freepik",
    monthlyPrice: 20,
    generations: 72,
    concurrent: "$150/mo for concurrent",
    queueLimit: "Limited",
    waitTimes: "Long queue times",
  },
  {
    name: "Krea",
    monthlyPrice: 56,
    generations: 400,
    concurrent: "32 concurrent",
    queueLimit: "Unknown",
    waitTimes: "No priority info",
  },
];

// Calculate comparison multiplier (how many more gens we provide per dollar)
function getValueMultiplier(competitor: CompetitorData, us: CompetitorData): number {
  const ourValuePerDollar = us.generations / us.monthlyPrice;
  const theirValuePerDollar = competitor.generations / competitor.monthlyPrice;
  return ourValuePerDollar / theirValuePerDollar;
}

function ComparisonBadge({ multiplier }: { multiplier: number }) {
  if (multiplier <= 1) return null;

  // Calculate percentage more expensive
  // If multiplier is 36x (we give 36x more value per dollar), it means they are roughly 36x more expensive per unit of value.
  const percentMoreExpensive = Math.round((multiplier - 1) * 100);

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase whitespace-nowrap">
      {percentMoreExpensive.toLocaleString()}% MORE EXPENSIVE
    </span>
  );
}

export function CompetitorComparison() {
  const usData = competitors.find((c) => c.isUs)!;

  return (
    <ScrollReveal>
      <div className="w-full overflow-hidden rounded-2xl glass-effect-home">
        {/* Header */}
        <div className="px-6 py-8 text-center border-b border-white/5">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Pay less, generate more</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Other apps have expensive plans and confusing credit systems. All comparisons below are based on <b>monthly subscription plans</b>
            .
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            {/* Column Headers */}
            <thead>
              <tr className="border-b border-white/5">
                {/* Model Row Label */}
                <th className="text-left p-4 w-48">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-muted-foreground">Monthly Plan Comparison</span>
                    </div>
                  </div>
                </th>

                {/* Provider columns */}
                {competitors.map((competitor) => (
                  <th
                    key={competitor.name}
                    className={cn(
                      "p-4 text-left min-w-[140px] relative",
                      competitor.isUs && "bg-primary/10 border-x-2 border-t-2 border-primary/40 rounded-t-xl"
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <span className={cn("font-bold text-sm", competitor.isUs ? "text-primary" : "text-foreground")}>
                        {competitor.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Monthly Price Row */}
              <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">Monthly Price</span>
                  </div>
                </td>

                {competitors.map((competitor) => (
                  <td
                    key={competitor.name}
                    className={cn("p-4", competitor.isUs && "bg-primary/10 border-x-2 border-primary/40")}
                  >
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        competitor.isUs ? "text-green-400" : "text-red-400"
                      )}
                    >
                      ${competitor.monthlyPrice} / month
                    </span>
                  </td>
                ))}
              </tr>

              {/* Nano Banana Pro Row */}
              <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Google Logo Placeholder */}
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">Nano Banana Pro</span>
                      <span className="text-xs text-muted-foreground">4K resolution • Monthly quota</span>
                    </div>
                  </div>
                </td>

                {competitors.map((competitor) => {
                  const multiplier = competitor.isUs ? 1 : getValueMultiplier(competitor, usData);

                  return (
                    <td
                      key={competitor.name}
                      className={cn("p-4", competitor.isUs && "bg-primary/10 border-x-2 border-primary/40")}
                    >
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-baseline">
                          <span className={cn("font-bold tabular-nums text-base", competitor.isUs ? "text-primary" : "text-foreground")}>
                            {competitor.generations.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground ml-2 text-sm">images / month</span>
                        </div>
                        {!competitor.isUs && <ComparisonBadge multiplier={multiplier} />}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Concurrent Generations Row */}
              <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shrink-0">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">Concurrent Gens</span>
                  </div>
                </td>

                {competitors.map((competitor) => (
                  <td
                    key={competitor.name}
                    className={cn("p-4", competitor.isUs && "bg-primary/10 border-x-2 border-primary/40")}
                  >
                    <div className="flex items-center gap-1.5">
                      {competitor.isUs && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                      <span className={cn("text-sm", competitor.isUs ? "text-green-400 font-semibold" : "text-muted-foreground")}>
                        {competitor.concurrent}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Queue Limit Row */}
              <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">Queue Limit</span>
                  </div>
                </td>

                {competitors.map((competitor) => (
                  <td
                    key={competitor.name}
                    className={cn("p-4", competitor.isUs && "bg-primary/10 border-x-2 border-primary/40")}
                  >
                    <div className="flex items-center gap-1.5">
                      {competitor.isUs && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                      <span className={cn("text-sm", competitor.isUs ? "text-green-400 font-semibold" : "text-muted-foreground")}>
                        {competitor.queueLimit}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Wait Times Row */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-white/10 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">Wait Times</span>
                  </div>
                </td>

                {competitors.map((competitor) => (
                  <td
                    key={competitor.name}
                    className={cn(
                      "p-4",
                      competitor.isUs && "bg-primary/10 border-x-2 border-b-2 border-primary/40 rounded-b-xl"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {competitor.isUs ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-destructive/70" />}
                      <span className={cn("text-sm", competitor.isUs ? "text-green-400 font-semibold" : "text-muted-foreground")}>
                        {competitor.waitTimes}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ScrollReveal>
  );
}
