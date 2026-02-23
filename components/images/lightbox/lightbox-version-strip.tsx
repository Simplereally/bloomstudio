"use client";

import NextImage from "next/image";
import * as React from "react";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface LightboxVersionStripProps {
	versions: readonly LightboxImage[];
	selectedIndex: number;
	onSelect: (index: number) => void;
}

export function LightboxVersionStrip({
	versions,
	selectedIndex,
	onSelect,
}: LightboxVersionStripProps) {
	const isMobile = useIsMobile();
	const scrollRef = React.useRef<HTMLUListElement>(null);

	// Scroll selected into view
	React.useEffect(() => {
		if (scrollRef.current) {
			const selectedEl = scrollRef.current.children[
				selectedIndex
			] as HTMLElement;
			if (selectedEl) {
				selectedEl.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "center",
				});
			}
		}
	}, [selectedIndex]);

	if (versions.length <= 1) return null;

	return (
		<div className="flex w-full justify-center pointer-events-none">
			<ul
				ref={scrollRef}
				aria-label="Image versions"
				className={cn(
					"pointer-events-auto inline-flex items-center overflow-x-auto pb-4 pt-2 max-w-full px-4 scroll-smooth",
					"scrollbar-width-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
					isMobile ? "gap-3" : "gap-4",
				)}
			>
				{versions.map((version, index) => {
					const label = index === 0 ? "Original" : `Edit ${index}`;
					const isSelected = index === selectedIndex;
					const thumbUrl = version.url;

					return (
						<li key={`${version.url}-${index}`} className="shrink-0 py-2">
							<button
								type="button"
								aria-label={`Select ${label}`}
								aria-current={isSelected ? "true" : undefined}
								onClick={() => onSelect(index)}
								className={cn(
									"relative overflow-hidden rounded-xl border-2 transition-all duration-300 ease-out",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
									isMobile ? "h-20 w-20" : "h-24 w-24",
									isSelected
										? "border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 z-10 translate-y-[-4px]"
										: "border-white/10 hover:border-white/40 hover:scale-105 hover:translate-y-[-2px] opacity-70 hover:opacity-100",
								)}
							>
								<NextImage
									src={thumbUrl}
									alt=""
									width={192}
									height={192}
									unoptimized={thumbUrl.startsWith("http")}
									draggable={false}
									className="h-full w-full object-cover"
								/>
								<div
									className={cn(
										"absolute inset-x-0 bottom-0 px-1 py-1 transition-colors duration-300",
										isSelected
											? "bg-black/60 backdrop-blur-[2px]"
											: "bg-gradient-to-t from-black/90 via-black/40 to-transparent",
									)}
								>
									<span
										className={cn(
											"block truncate text-center text-[10px] font-bold uppercase tracking-wider",
											isSelected ? "text-white" : "text-white/80",
										)}
									>
										{index === 0 ? "Orig" : `V${index}`}
									</span>
								</div>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
