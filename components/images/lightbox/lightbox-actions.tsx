"use client";

import { BookmarkPlus, Check, Copy, LogIn, Wand2 } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export interface LightboxActionsProps {
	isSignedIn: boolean;
	isLoadingDetails: boolean;
	hasPrompt: boolean;
	copied: boolean;
	onCopyPrompt: (e: React.MouseEvent) => void;
	onOpenSaveToLibrary: () => void;
	onOpenEdit: () => void;
	canEdit: boolean;
}

export function LightboxActions({
	isSignedIn,
	isLoadingDetails,
	hasPrompt,
	copied,
	onCopyPrompt,
	onOpenSaveToLibrary,
	onOpenEdit,
	canEdit,
}: LightboxActionsProps) {
	const buttonClassName =
		"h-10 w-10 mb-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg";
	const disabledButtonClassName =
		"h-10 w-10 mb-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white border border-white/10 backdrop-blur-md transition-all shrink-0 hover:scale-105 active:scale-95 shadow-lg";

	return (
		<>
			{canEdit &&
				(isSignedIn ? (
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className={buttonClassName}
								onClick={(e) => {
									e.stopPropagation();
									onOpenEdit();
								}}
								disabled={isLoadingDetails}
							>
								<Wand2 className="h-5 w-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top" className="z-[100]">
							<p className="font-medium">Edit Image</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<Link href="/sign-in" onClick={(e) => e.stopPropagation()}>
								<Button
									variant="ghost"
									size="icon"
									className={disabledButtonClassName}
								>
									<Wand2 className="h-5 w-5" />
								</Button>
							</Link>
						</TooltipTrigger>
						<TooltipContent side="top" className="z-[100]">
							<div className="flex items-center gap-2">
								<LogIn className="h-3.5 w-3.5" />
								<p className="font-medium">Sign in to edit images</p>
							</div>
						</TooltipContent>
					</Tooltip>
				))}

			{isSignedIn ? (
				<Tooltip delayDuration={200}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className={buttonClassName}
							onClick={(e) => {
								e.stopPropagation();
								onOpenSaveToLibrary();
							}}
							disabled={isLoadingDetails || !hasPrompt}
						>
							<BookmarkPlus className="h-5 w-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" className="z-[100]">
						<p className="font-medium">Save to Library</p>
					</TooltipContent>
				</Tooltip>
			) : (
				<Tooltip delayDuration={200}>
					<TooltipTrigger asChild>
						<Link href="/sign-in" onClick={(e) => e.stopPropagation()}>
							<Button
								variant="ghost"
								size="icon"
								className={disabledButtonClassName}
							>
								<BookmarkPlus className="h-5 w-5" />
							</Button>
						</Link>
					</TooltipTrigger>
					<TooltipContent side="top" className="z-[100]">
						<div className="flex items-center gap-2">
							<LogIn className="h-3.5 w-3.5" />
							<p className="font-medium">Sign in to save prompts</p>
						</div>
					</TooltipContent>
				</Tooltip>
			)}

			{isSignedIn ? (
				<Tooltip delayDuration={200}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className={buttonClassName}
							onClick={onCopyPrompt}
							disabled={isLoadingDetails || !hasPrompt}
						>
							{copied ? (
								<Check className="h-5 w-5 text-green-400" />
							) : (
								<Copy className="h-5 w-5" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top" className="z-[100]">
						<p className="font-medium">{copied ? "Copied!" : "Copy prompt"}</p>
					</TooltipContent>
				</Tooltip>
			) : (
				<Tooltip delayDuration={200}>
					<TooltipTrigger asChild>
						<Link href="/sign-in" onClick={(e) => e.stopPropagation()}>
							<Button
								variant="ghost"
								size="icon"
								className={disabledButtonClassName}
							>
								<Copy className="h-5 w-5" />
							</Button>
						</Link>
					</TooltipTrigger>
					<TooltipContent side="top" className="z-[100]">
						<div className="flex items-center gap-2">
							<LogIn className="h-3.5 w-3.5" />
							<p className="font-medium">Sign in to copy prompts</p>
						</div>
					</TooltipContent>
				</Tooltip>
			)}
		</>
	);
}
