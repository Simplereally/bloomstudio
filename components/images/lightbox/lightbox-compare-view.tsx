"use client";

import type * as React from "react";
import type { LightboxImage } from "@/hooks/use-image-lightbox";
import { cn } from "@/lib/utils";
import { LightboxPane } from "./lightbox-pane";

export interface LightboxCompareViewProps {
	/** The original image (always shown in left pane) */
	baseImage: LightboxImage;
	/** The currently selected version (shown in right pane) */
	selectedImage: LightboxImage;
	/** Whether user is signed in (for auth-gating actions) */
	isSignedIn: boolean;
	/** Whether images can be edited (false for videos) */
	canEdit: boolean;
	/** Whether an edit is currently generating */
	isGenerating?: boolean;
	/** Callback when Edit button is clicked on either pane */
	onEdit: (image: LightboxImage) => void;
	/** Callback when Save to Library button is clicked */
	onSaveToLibrary: (prompt: string) => void;
	/** Callback when Copy Prompt button is clicked */
	onCopyPrompt: (prompt: string) => void;
	/** Callback when backdrop is clicked to close */
	onBackdropClick: () => void;
	/** Whether the edit panel is open (affects layout on desktop) */
	isEditPanelOpen?: boolean;
	/** Render prop for the docked edit panel (desktop only) */
	renderEditPanel?: () => React.ReactNode;
}

/**
 * Side-by-side comparison view with two independent LightboxPane components.
 * Each pane has its own hover state, zoom capability, and overlay with actions.
 *
 * When the edit panel is open on desktop, the grid expands to include a third
 * column for the docked edit panel, keeping both images visible.
 */
export function LightboxCompareView({
	baseImage,
	selectedImage,
	isSignedIn,
	canEdit,
	isGenerating = false,
	onEdit,
	onSaveToLibrary,
	onCopyPrompt,
	onBackdropClick,
	isEditPanelOpen = false,
	renderEditPanel,
}: LightboxCompareViewProps) {
	// Determine if left and right panes show the same image
	// (happens when selectedImage is the original)
	const isOriginalSelected =
		baseImage.url === selectedImage.url &&
		baseImage.originalUrl === selectedImage.originalUrl;

	return (
		<div className="relative h-full w-full p-2">
			{/* 
				Grid layout:
				- Mobile: 2 rows (stacked images), edit panel overlays from bottom
				- Desktop without edit panel: 2 columns (side-by-side images)
				- Desktop with edit panel: 3 columns [image, image, panel] with reserved space
			*/}
			<div
				className={cn(
					"grid h-full w-full gap-2",
					// Mobile: always 2 rows for images
					"grid-rows-2",
					// Desktop: columns based on edit panel state
					isEditPanelOpen
						? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px] md:grid-rows-1"
						: "md:grid-cols-2 md:grid-rows-1",
				)}
			>
				{/* Left pane - Original image */}
				<div className="bg-black/20 rounded-lg overflow-hidden min-w-0">
					<LightboxPane
						image={baseImage}
						label="Original"
						isSelected={isOriginalSelected}
						isSignedIn={isSignedIn}
						canEdit={canEdit}
						isGenerating={isGenerating}
						onEdit={onEdit}
						onSaveToLibrary={onSaveToLibrary}
						onCopyPrompt={onCopyPrompt}
						onBackdropClick={onBackdropClick}
					/>
				</div>

				{/* Right pane - Current/selected version */}
				<div className="bg-black/20 rounded-lg overflow-hidden min-w-0">
					<LightboxPane
						image={selectedImage}
						label="Current"
						isSelected={!isOriginalSelected}
						isSignedIn={isSignedIn}
						canEdit={canEdit}
						isGenerating={isGenerating}
						onEdit={onEdit}
						onSaveToLibrary={onSaveToLibrary}
						onCopyPrompt={onCopyPrompt}
						onBackdropClick={onBackdropClick}
					/>
				</div>

				{/* Docked edit panel - Desktop only, hidden on mobile */}
				{isEditPanelOpen && renderEditPanel && (
					<div className="hidden md:block rounded-lg overflow-hidden">
						{renderEditPanel()}
					</div>
				)}
			</div>
		</div>
	);
}
