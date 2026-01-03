"use client"

/**
 * PromptCard - Pure presentational component for displaying truncated prompts
 */

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Check, Copy, CornerDownLeft, Trash2 } from "lucide-react"
import * as React from "react"
import type { Prompt } from "./types"

export interface PromptCardProps {
    prompt: Prompt
    onSelect: () => void
    onCopy: () => void
    onInsert: () => void
    onRemove: () => void
}

export const PromptCard = React.memo(function PromptCard({
    prompt,
    onSelect,
    onCopy,
    onInsert,
    onRemove,
}: PromptCardProps) {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        onCopy()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className="group relative p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer"
            onClick={onSelect}
        >
            {/* Title and type badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm line-clamp-1 flex-1">
                    {prompt.title}
                </h4>
                <Badge
                    variant={prompt.type === "positive" ? "default" : "secondary"}
                    className="text-[10px] shrink-0"
                >
                    {prompt.type === "positive" ? "+" : "−"}
                </Badge>
            </div>

            {/* Truncated content */}
            <p className="text-xs text-muted-foreground line-clamp-5 mb-3">
                {prompt.content}
            </p>

            {/* Tags */}
            {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {prompt.tags.slice(0, 3).map((tag) => (
                        <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                        >
                            {tag}
                        </Badge>
                    ))}
                    {prompt.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                            +{prompt.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Action buttons - show on hover */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md p-0.5 border border-border/50 shadow-sm">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                                e.stopPropagation()
                                onInsert()
                            }}
                        >
                            <CornerDownLeft className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert into prompt</TooltipContent>
                </Tooltip>

                <AlertDialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Remove from library</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove prompt?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete <span className="font-medium text-foreground">&ldquo;{prompt.title}&rdquo;</span> from your library. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onRemove}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
})
