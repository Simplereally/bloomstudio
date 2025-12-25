"use client"

import { Progress } from "@/components/ui/progress"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadProgressProps {
    progress: number
    filename: string
    onCancel?: () => void
}

export function UploadProgress({ progress, filename, onCancel }: UploadProgressProps) {
    return (
        <div className="space-y-2 p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex justify-between items-center text-xs font-medium">
                <span className="truncate max-w-[180px] text-muted-foreground mr-2">
                    {filename}
                </span>
                <div className="flex items-center gap-2">
                    <span>{Math.round(progress)}%</span>
                    {onCancel && progress < 100 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full"
                            onClick={onCancel}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
            <Progress value={progress} className="h-1.5" />
        </div>
    )
}
