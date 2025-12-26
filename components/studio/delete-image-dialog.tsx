"use client"

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
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface DeleteImageDialogProps {
    onConfirm: () => Promise<void>
    isDeleting?: boolean
    title?: string
    description?: string
}

export function DeleteImageDialog({
    onConfirm,
    isDeleting: isDeletingProp,
    title = "Delete Image",
    description = "This action cannot be undone. The image will be permanently deleted from your gallery and storage."
}: DeleteImageDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeletingLocal, setIsDeletingLocal] = useState(false)

    const isDeleting = isDeletingProp || isDeletingLocal

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDeletingLocal(true)
        try {
            await onConfirm()
            setIsOpen(false)
        } finally {
            setIsDeletingLocal(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={isDeleting}
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
