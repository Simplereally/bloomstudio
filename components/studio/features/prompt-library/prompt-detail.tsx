"use client"

/**
 * PromptDetail - Full prompt detail view with actions
 * 
 * Design approach:
 * - Hero card with gradient accent based on prompt type
 * - Clean typography hierarchy with the title as focal point
 * - Metadata displayed as elegant inline chips below content
 * - Floating action bar with premium button styling
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
import { cn } from "@/lib/utils"
import { ArrowLeft, Check, Copy, CornerDownLeft, FolderOpen, Tag, Trash2 } from "lucide-react"
import * as React from "react"
import { PromptLibraryHeader } from "./prompt-library-header"
import type { Prompt } from "./types"

export interface PromptDetailProps {
    prompt: Prompt
    onBack: () => void
    onCopy: () => void
    onInsert: () => void
    onRemove: () => void
}

export const PromptDetail = React.memo(function PromptDetail({
    prompt,
    onBack,
    onCopy,
    onInsert,
    onRemove,
}: PromptDetailProps) {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        onCopy()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isPositive = prompt.type === "positive"

    return (
        <div className="flex flex-col min-h-0 flex-1 gap-4">
            <PromptLibraryHeader />
            
            {/* Back button - minimal, top-left */}
            <Button
                variant="ghost"
                size="sm"
                className="w-fit gap-2 text-muted-foreground hover:text-foreground"
                onClick={onBack}
            >
                <ArrowLeft className="h-4 w-4" />
                Back to library
            </Button>

            {/* Hero Card */}
            <div className={cn(
                "relative rounded-xl border overflow-hidden",
                "bg-gradient-to-br from-background via-background to-muted/30"
            )}>
                {/* Type accent bar */}
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    isPositive
                        ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500"
                        : "bg-gradient-to-r from-rose-500 via-rose-400 to-orange-500"
                )} />

                <div className="p-5 pt-6 space-y-4">
                    {/* Title and type badge */}
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-semibold leading-tight">
                            {prompt.title}
                        </h2>
                        <Badge
                            variant="outline"
                            className={cn(
                                "shrink-0 border-transparent text-xs font-medium",
                                isPositive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            )}
                        >
                            {isPositive ? "Positive" : "Negative"}
                        </Badge>
                    </div>

                    {/* Content */}
                    <div className="rounded-lg bg-muted/50 border border-border/50 p-4 max-h-52 overflow-y-auto">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                            {prompt.content}
                        </p>
                    </div>

                    {/* Metadata row - category and tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {prompt.category && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/70 text-sm text-muted-foreground">
                                <FolderOpen className="h-3.5 w-3.5" />
                                <span>{prompt.category}</span>
                            </div>
                        )}
                        {prompt.tags.length > 0 && (
                            <>
                                {prompt.category && (
                                    <span className="text-border">|</span>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                    {prompt.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-xs font-normal px-2 py-0.5"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 pt-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                            Remove
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
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

                <div className="flex-1" />

                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <>
                            <Check className="h-4 w-4 text-emerald-500" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4" />
                            Copy
                        </>
                    )}
                </Button>

                <Button
                    size="sm"
                    className={cn(
                        "gap-2",
                        "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    )}
                    onClick={onInsert}
                >
                    <CornerDownLeft className="h-4 w-4" />
                    Insert Prompt
                </Button>
            </div>
        </div>
    )
})
