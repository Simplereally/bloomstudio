"use client";

/**
 * Connect Button
 *
 * Standardized button for initiating the BYOP OAuth flow with Pollinations.
 * Provides visual feedback during redirect and supports multiple size variants.
 */

import { Button } from "@/components/ui/button";
import { usePollenAuth } from "@/lib/pollen-auth";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, Zap } from "lucide-react";
import { useState } from "react";

type ButtonProps = React.ComponentProps<typeof Button>;

export interface ConnectButtonProps
  extends Omit<ButtonProps, "onClick" | "asChild"> {
  /** Custom text for the button */
  children?: React.ReactNode;
  /** Show "Zero API Costs" badge */
  showBadge?: boolean;
  /** Icon to display (defaults to Zap) */
  icon?: "zap" | "external" | "none";
}

/**
 * A polished button that initiates the Pollinations OAuth flow.
 * Handles loading state during redirect and provides visual feedback.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ConnectButton />
 *
 * // Custom text
 * <ConnectButton>Get Started Free</ConnectButton>
 *
 * // With badge
 * <ConnectButton showBadge />
 * ```
 */
export function ConnectButton({
  children,
  className,
  showBadge = false,
  icon = "zap",
  disabled,
  variant = "default",
  size = "default",
  ...props
}: ConnectButtonProps) {
  const { authorize, isLoading: isAuthLoading } = usePollenAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleConnect = () => {
    setIsRedirecting(true);
    authorize();
    // Note: Won't actually reset since we're navigating away,
    // but included for potential future use with popup flows
  };

  const isLoading = isAuthLoading || isRedirecting;
  const buttonText = children ?? "Connect with Pollinations";

  const iconElement =
    icon === "none" ? null : icon === "external" ? (
      <ExternalLink className="w-4 h-4" />
    ) : (
      <Zap className="w-4 h-4 fill-current" />
    );

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Button
        onClick={handleConnect}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className={cn(
          "relative font-medium",
          size === "lg" && "h-12 px-6 text-base",
          !disabled && "shadow-lg shadow-primary/20 hover:shadow-primary/30"
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            {iconElement && <span className="mr-2">{iconElement}</span>}
            {buttonText}
          </>
        )}
      </Button>

      {showBadge && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
            <Zap className="w-3 h-3 fill-current" />
            Zero API Costs
          </span>
          <span>•</span>
          <span>One-click setup</span>
        </div>
      )}
    </div>
  );
}
