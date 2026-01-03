"use client"

/**
 * SavePromptForm - Premium form for creating new prompts
 * 
 * Design approach:
 * - Clean sectioned layout with visual grouping
 * - Type selector as prominent visual toggle cards
 * - Floating gradient accent on save button
 * - Smooth visual hierarchy guiding the user through the form
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePromptLibraryForm } from "@/hooks/use-prompt-library-form"
import { cn } from "@/lib/utils"
import { ArrowLeft, FolderOpen, Loader2, Plus, Tag, ThumbsDown, ThumbsUp } from "lucide-react"
import * as React from "react"
import Creatable from "react-select/creatable"
import { creatableClassNames, creatableStyles } from "./creatable-styles"
import { PromptLibraryHeader } from "./prompt-library-header"
import type { CategoryOption, PromptType } from "./types"

export interface SavePromptFormProps {
    initialContent?: string
    promptType: PromptType
    onSaved: () => void
    onCancel: () => void
}

export const SavePromptForm = React.memo(function SavePromptForm({
    initialContent,
    promptType,
    onSaved,
    onCancel,
}: SavePromptFormProps) {
    const {
        titleRef,
        contentRef,
        tagsRef,
        type,
        setType,
        category,
        setCategory,
        categories,
        handleSave,
        isSaving,
    } = usePromptLibraryForm({
        initialContent,
        defaultPromptType: promptType,
        onSaved,
    })

    // Transform categories for react-select
    const categoryOptions: CategoryOption[] = React.useMemo(
        () => (categories ?? []).map((cat) => ({ label: cat, value: cat })),
        [categories]
    )

    const selectedCategory: CategoryOption | null = category
        ? { label: category, value: category }
        : null

    return (
        <div className="flex flex-col min-h-0 flex-1 gap-4">
            <PromptLibraryHeader />
            
            {/* Back button - minimal */}
            <Button
                variant="ghost"
                size="sm"
                className="w-fit gap-2 text-muted-foreground hover:text-foreground"
                onClick={onCancel}
            >
                <ArrowLeft className="h-4 w-4" />
                Back to library
            </Button>

            {/* Scrollable form area */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5">
                {/* Title - Primary focus field */}
                <div className="space-y-2">
                    <Label htmlFor="prompt-title" className="text-sm font-medium">
                        Prompt Title
                    </Label>
                    <Input
                        ref={titleRef}
                        id="prompt-title"
                        placeholder="Give your prompt a memorable name..."
                        defaultValue=""
                        className="text-base h-11"
                    />
                </div>

                {/* Content - Main textarea */}
                <div className="space-y-2">
                    <Label htmlFor="prompt-content" className="text-sm font-medium">
                        Prompt Content
                    </Label>
                    <Textarea
                        ref={contentRef}
                        id="prompt-content"
                        placeholder="Write your prompt here..."
                        defaultValue={initialContent ?? ""}
                        className="min-h-32 max-h-56 resize-y text-sm leading-relaxed"
                    />
                </div>

                {/* Type selector - Visual toggle cards */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Prompt Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <TypeCard
                            isSelected={type === "positive"}
                            onClick={() => setType("positive")}
                            icon={ThumbsUp}
                            label="Positive"
                            description="Attributes you want to include in an image"
                            accentClass="from-emerald-500 to-teal-500"
                            selectedBgClass="bg-emerald-500/5 border-emerald-500/30"
                        />
                        <TypeCard
                            isSelected={type === "negative"}
                            onClick={() => setType("negative")}
                            icon={ThumbsDown}
                            label="Negative"
                            description="Attributes you want to avoid in an image"
                            accentClass="from-rose-500 to-orange-500"
                            selectedBgClass="bg-rose-500/5 border-rose-500/30"
                        />
                    </div>
                </div>

                {/* Category and Tags - Secondary organization */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            Category
                        </Label>
                        <Creatable<CategoryOption>
                            inputId="prompt-category"
                            value={selectedCategory}
                            onChange={(option) => setCategory(option?.value ?? null)}
                            options={categoryOptions}
                            placeholder="Select or create..."
                            isClearable
                            formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                            classNames={creatableClassNames}
                            styles={creatableStyles}
                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prompt-tags" className="text-sm font-medium flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            Tags
                        </Label>
                        <Input
                            ref={tagsRef}
                            id="prompt-tags"
                            placeholder="portrait, realistic..."
                            defaultValue=""
                        />
                        <p className="text-xs text-muted-foreground">Separate with commas</p>
                    </div>
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="text-muted-foreground"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                        "gap-2 min-w-[140px]",
                        "bg-gradient-to-r from-primary to-primary/80",
                        "hover:from-primary/90 hover:to-primary/70",
                        "shadow-md hover:shadow-lg transition-shadow"
                    )}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            Save to Library
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
})

/**
 * TypeCard - Visual toggle for selecting prompt type
 */
interface TypeCardProps {
    isSelected: boolean
    onClick: () => void
    icon?: React.ComponentType<{ className?: string }>
    label: string
    description: string
    accentClass: string
    selectedBgClass: string
}

function TypeCard({
    isSelected,
    onClick,
    icon: Icon,
    label,
    description,
    accentClass,
    selectedBgClass,
}: TypeCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all overflow-hidden",
                "hover:bg-muted/50",
                isSelected
                    ? selectedBgClass
                    : "border-border/50 bg-background"
            )}
        >
            {/* Gradient accent bar when selected */}
            {isSelected && (
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-0.5 rounded-t-lg bg-gradient-to-r",
                    accentClass
                )} />
            )}
            <div className="flex items-center gap-2">
                {Icon && (
                    <Icon className={cn(
                        "h-4 w-4",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                    )} />
                )}
                <span className={cn(
                    "font-medium text-sm",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                )}>
                    {label}
                </span>
            </div>
            <span className="text-xs text-muted-foreground">
                {description}
            </span>
        </button>
    )
}
