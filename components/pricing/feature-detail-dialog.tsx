"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface FeatureDetailDialogProps {
    title: string
    description: string
    cardTitle: string
    cardDescription: string
    footer: string
}

export function FeatureDetailDialog({ 
    title, 
    description, 
    cardTitle, 
    cardDescription, 
    footer 
}: FeatureDetailDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button 
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 transition-all cursor-pointer"
                >
                    How?
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-card/95 backdrop-blur-2xl border-primary/10 shadow-2xl p-8 rounded-3xl">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                            {title}
                        </DialogTitle>
                    </div>
                    
                    <div className="space-y-6 pt-2 text-center sm:text-left">
                        <p className="text-base text-foreground/80 leading-relaxed font-medium">
                            {description}
                        </p>

                        <div className="relative group text-left">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                                <div className="text-3xl font-black tracking-tighter text-primary mb-1">
                                    {cardTitle}
                                </div>
                                <p className="text-sm text-muted-foreground leading-snug">
                                    {cardDescription}
                                </p>
                            </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold pt-2 text-center">
                            {footer}
                        </p>
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
