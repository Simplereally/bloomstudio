"use client"

/**
 * ControlsFeature - Feature component that composes generation settings logic with UI
 * 
 * This component:
 * 1. Uses generation settings from context if available (integrated mode)
 * 2. Or creates its own settings (standalone mode)
 * 3. Fetches models data via useImageModels
 * 4. Computes dimension info for limit display
 * 5. Passes all data into the ControlsView presentational component
 * 
 * It acts as the "glue" between logic and presentation, forming an isolated
 * vertical feature unit that doesn't affect other parts of the Studio.
 */

import { useImageModels } from "@/hooks/queries"
import { useDimensionInfo } from "@/hooks/use-dimension-info"
import { useGenerationSettings, type UseGenerationSettingsReturn } from "@/hooks/use-generation-settings"
import { useBatchMode, type UseBatchModeReturn } from "@/hooks/use-batch-mode"
import { useImageGalleryState } from "@/hooks/use-image-gallery-state"
import { ControlsView } from "./controls-view"
import * as React from "react"

export interface ControlsFeatureProps {
    /** Whether generation is in progress */
    isGenerating?: boolean
}

/**
 * Context to share generation settings state with other features
 */
export const GenerationSettingsContext = React.createContext<UseGenerationSettingsReturn | null>(null)

/**
 * Context to share batch mode state with other features
 */
export const BatchModeContext = React.createContext<UseBatchModeReturn | null>(null)

/**
 * Hook to access generation settings from child components
 */
export function useGenerationSettingsContext() {
    const context = React.useContext(GenerationSettingsContext)
    if (!context) {
        throw new Error("useGenerationSettingsContext must be used within ControlsFeature")
    }
    return context
}

/**
 * Hook to access batch mode from child components
 */
export function useBatchModeContext() {
    const context = React.useContext(BatchModeContext)
    if (!context) {
        throw new Error("useBatchModeContext must be used within ControlsFeature")
    }
    return context
}

/**
 * Internal view component that renders with given settings
 */
function ControlsFeatureView({
    generationSettings,
    batchMode,
    isGenerating,
}: {
    generationSettings: UseGenerationSettingsReturn
    batchMode: UseBatchModeReturn
    isGenerating: boolean
}) {
    // Models data (always fetched fresh - not stateful)
    const { models, isLoading: isLoadingModels } = useImageModels()

    // Compute dimension info for limit display (derived from settings)
    const { 
        megapixels, 
        isOverLimit, 
        percentOfLimit, 
        hasPixelLimit, 
        isEnabled: dimensionsEnabled 
    } = useDimensionInfo({
        modelId: generationSettings.model,
        width: generationSettings.width,
        height: generationSettings.height,
    })

    return (
        <ControlsView
            // Model
            model={generationSettings.model}
            onModelChange={generationSettings.handleModelChange}
            models={models}
            isLoadingModels={isLoadingModels}
            isGenerating={isGenerating}
            
            // Aspect ratio
            aspectRatio={generationSettings.aspectRatio}
            onAspectRatioChange={generationSettings.handleAspectRatioChange}
            aspectRatios={generationSettings.aspectRatios}
            
            // Resolution tier
            resolutionTier={generationSettings.resolutionTier}
            onResolutionTierChange={generationSettings.handleResolutionTierChange}
            constraints={generationSettings.constraints}
            
            // Dimensions
            width={generationSettings.width}
            height={generationSettings.height}
            onWidthChange={generationSettings.handleWidthChange}
            onHeightChange={generationSettings.handleHeightChange}
            dimensionsEnabled={dimensionsEnabled}
            dimensionsLinked={generationSettings.dimensionsLinked}
            onDimensionsLinkedChange={generationSettings.setDimensionsLinked}
            megapixels={megapixels}
            isOverLimit={isOverLimit}
            percentOfLimit={percentOfLimit ?? 0}
            hasPixelLimit={hasPixelLimit}
            
            // Reference image
            referenceImage={generationSettings.referenceImage}
            onReferenceImageChange={generationSettings.setReferenceImage}
            
            // Seed
            seed={generationSettings.seed}
            onSeedChange={generationSettings.setSeed}
            seedLocked={generationSettings.seedLocked}
            onSeedLockedChange={generationSettings.setSeedLocked}
            
            // Options
            options={generationSettings.options}
            onOptionsChange={generationSettings.setOptions}
            
            // Batch mode
            batchSettings={batchMode.batchSettings}
            onBatchSettingsChange={batchMode.setBatchSettings}
            isBatchActive={batchMode.isBatchActive}
        />
    )
}

/**
 * Standalone ControlsFeature that creates its own state
 */
function ControlsFeatureStandalone({ 
    isGenerating,
}: {
    isGenerating: boolean
}) {
    // Create own generation settings
    const generationSettings = useGenerationSettings()
    
    // Gallery state for batch mode (to add images)
    const { addImage } = useImageGalleryState()

    // Create own batch mode (needs generateSeed from settings and addImage from gallery)
    const batchMode = useBatchMode({
        generateSeed: generationSettings.generateSeed,
        addImage,
    })

    return (
        <GenerationSettingsContext.Provider value={generationSettings}>
            <BatchModeContext.Provider value={batchMode}>
                <ControlsFeatureView
                    generationSettings={generationSettings}
                    batchMode={batchMode}
                    isGenerating={isGenerating}
                />
            </BatchModeContext.Provider>
        </GenerationSettingsContext.Provider>
    )
}

/**
 * ControlsFeature component - composes hook logic with view
 * 
 * When wrapped in GenerationSettingsContext and BatchModeContext providers,
 * uses the provided contexts. Otherwise, creates its own state (standalone mode).
 * 
 * @example
 * ```tsx
 * // Standalone usage
 * <ControlsFeature isGenerating={isGenerating} />
 * 
 * // Integrated usage (with shared state)
 * <GenerationSettingsContext.Provider value={generationSettings}>
 *     <BatchModeContext.Provider value={batchMode}>
 *         <ControlsFeature isGenerating={isGenerating} />
 *     </BatchModeContext.Provider>
 * </GenerationSettingsContext.Provider>
 * ```
 */
export function ControlsFeature({ 
    isGenerating = false,
}: ControlsFeatureProps) {
    const existingSettings = React.useContext(GenerationSettingsContext)
    const existingBatchMode = React.useContext(BatchModeContext)

    // If both contexts are provided by parent, use them (integrated mode)
    if (existingSettings && existingBatchMode) {
        return (
            <ControlsFeatureView
                generationSettings={existingSettings}
                batchMode={existingBatchMode}
                isGenerating={isGenerating}
            />
        )
    }

    // Otherwise, create own state (standalone mode)
    return (
        <ControlsFeatureStandalone
            isGenerating={isGenerating}
        />
    )
}
