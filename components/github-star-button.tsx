import { Github, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import * as React from "react";

type GitHubStarButtonProps = {
  owner?: string;
  repo?: string;
  className?: string;
};

export default function GitHubStarButton({ owner = "pollinations", repo = "pollinations", className }: GitHubStarButtonProps) {
  const [stars, setStars] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const url = `https://github.com/${owner}/${repo}`;

  React.useEffect(() => {
    async function fetchStars() {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        // Format large numbers (e.g., 1234 -> 1.2k)
        const count = data.stargazers_count;
        if (count > 1000) {
          setStars((count / 1000).toFixed(1) + "k");
        } else {
          setStars(count.toString());
        }
      } catch (error) {
        console.error("Error fetching GitHub stars:", error);
        setStars("1.2k+"); // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchStars();
  }, [owner, repo]);

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    // Open in a centered popup window to keep the user "in the app"
    const width = 600;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(url, "github-star", `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`);
  };

  return (
    <a
      href={url}
      onClick={handleAction}
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "group relative flex items-center gap-3 px-6 py-7 h-auto bg-background hover:bg-muted border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md",
        className
      )}
    >
      {/* Subtle background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-2.5 relative z-10">
        <Github className="w-6 h-6" />
        <div className="flex flex-col items-start leading-none">
          <span className="font-bold text-base">Star on GitHub</span>
          <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Open source</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors relative z-10 border border-primary/10">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <>
            <Star className="w-4 h-4 text-primary fill-primary/20 group-hover:fill-primary/40 transition-all" />
            <span className="text-sm font-bold text-primary tabular-nums">{stars}</span>
          </>
        )}
      </div>
    </a>
  );
}
