"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, Key, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { encryptKey } from "@/app/settings/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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


export function ApiCard() {
    // Current state only lets us know IF a key changes, we can't see the key itself.
    const savedKey = useQuery(api.users.getPollinationsApiKey)
    const setApiKey = useMutation(api.users.setPollinationsApiKey)
    const removeApiKey = useMutation(api.users.removePollinationsApiKey)
    
    const [inputKey, setInputKey] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    // Check if key is set (savedKey is a string if set, null if not)
    const isLoading = savedKey === undefined
    const hasKey = savedKey !== undefined && savedKey !== null && savedKey !== ""

    const handleSave = async () => {
        if (!inputKey.trim()) return
        
        setIsSaving(true)
        try {
            // 1. Encrypt on server via Next.js Action
            const encrypted = await encryptKey(inputKey.trim())
            
            // 2. Save encrypted key to Convex
            await setApiKey({ encryptedApiKey: encrypted })
            
            toast.success("API Key saved successfully")
            setInputKey("") // Clear input for security
        } catch (error) {
            toast.error("Failed to save API Key")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemove = async () => {
        setIsRemoving(true)
        try {
            await removeApiKey({})
            toast.success("API Key removed")
        } catch (error) {
            toast.error("Failed to remove API Key")
        } finally {
            setIsRemoving(false)
        }
    }

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm border-l-4 border-l-yellow-500/50">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Key className="w-5 h-5 text-yellow-500" />
                            Configuration
                        </CardTitle>
                        <CardDescription>
                            Configure your Pollinations.ai API key.
                        </CardDescription>
                    </div>
                    {!isLoading && hasKey && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant="default" className="bg-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Why add this?</AlertTitle>
                    <AlertDescription className="text-xs opacity-90 mt-1">
                        Adding your own Pollinations API key allows you to use your personal rate limits instead of shared defaults.
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label htmlFor="apiKey">Pollinations API Key</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                id="apiKey"
                                type={isVisible ? "text" : "password"}
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                placeholder={isLoading ? "Loading..." : hasKey ? "Key is set and hidden" : "Enter your API key"}
                                className="pr-10 bg-background/50"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setIsVisible(!isVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <Button 
                            onClick={handleSave} 
                            disabled={!inputKey.trim() || isSaving || isLoading}
                        >
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save
                        </Button>
                    </div>
                    {hasKey && (
                        <div className="flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                                        disabled={isRemoving || isLoading}
                                    >
                                        {isRemoving ? "Removing..." : "Remove Key"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to remove your API key? You will need to provide it again to use your personal rate limits.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleRemove}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Remove Key
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
