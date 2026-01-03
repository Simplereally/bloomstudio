"use client"

/**
 * PromptListView - Prompt grid with search and filters
 * Pure presentational component
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Id } from "@/convex/_generated/dataModel"
import { Library, Loader2, Plus, Search, X } from "lucide-react"
import * as React from "react"
import { PromptCard } from "./prompt-card"
import { PromptLibraryHeader } from "./prompt-library-header"
import type { Prompt, PromptType } from "./types"

export interface PromptListViewProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    searchInputRef: React.RefObject<HTMLInputElement | null>
    typeFilter: PromptType | "all"
    onTypeFilterChange: (filter: PromptType | "all") => void
    prompts: Prompt[]
    isLoading: boolean
    onSelectPrompt: (prompt: Prompt) => void
    onCopyPrompt: (content: string) => void
    onInsertPrompt: (content: string) => void
    onRemovePrompt: (promptId: Id<"prompts">) => void
    onShowSaveForm: () => void
}

export function PromptListView({
    searchQuery,
    onSearchChange,
    searchInputRef,
    typeFilter,
    onTypeFilterChange,
    prompts,
    isLoading,
    onSelectPrompt,
    onCopyPrompt,
    onInsertPrompt,
    onRemovePrompt,
    onShowSaveForm,
}: PromptListViewProps) {
    return (
        <div className="flex flex-col min-h-0 flex-1 gap-4">
            <PromptLibraryHeader />
            
            {/* Search and filters - fixed */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        placeholder="Search prompts..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => onSearchChange("")}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                <Select
                    value={typeFilter}
                    onValueChange={(v) => onTypeFilterChange(v as PromptType | "all")}
                >
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                </Select>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={onShowSaveForm}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add new prompt</TooltipContent>
                </Tooltip>
            </div>

            {/* Prompts list - scrollable */}
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : prompts && prompts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pr-4">
                            {prompts.map((prompt) =>
                                prompt ? (
                                    <PromptCard
                                        key={prompt._id.toString()}
                                        prompt={prompt}
                                        onSelect={() => onSelectPrompt(prompt)}
                                        onCopy={() => onCopyPrompt(prompt.content)}
                                        onInsert={() => onInsertPrompt(prompt.content)}
                                        onRemove={() => onRemovePrompt(prompt._id)}
                                    />
                                ) : null
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Library className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery ? "No matches found" : "Your library is empty"}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                {searchQuery
                                    ? "Try different keywords"
                                    : "Save prompts to build your collection"}
                            </p>
                            {!searchQuery && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={onShowSaveForm}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add your first prompt
                                </Button>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    )
}
