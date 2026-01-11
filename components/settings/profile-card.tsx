"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User } from "lucide-react"
import { toast } from "sonner"

export function ProfileCard() {
    const user = useQuery(api.users.getCurrentUser)
    const updateUsername = useMutation(api.users.updateUsername)
    
    // Local state for the input
    const [username, setUsername] = useState<string>("")
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const initialized = useRef(false)

    // Sync from server once loaded
    if (user && !initialized.current) {
        setUsername(user.username ?? "")
        initialized.current = true
    }

    const hasChanges = user && username !== user.username

    const handleSave = async () => {
        if (!hasChanges) return
        
        setIsSaving(true)
        try {
            await updateUsername({ username })
            toast.success("Username updated")
            setIsEditing(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    if (!user) {
        return <ProfileCardSkeleton />
    }

    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader>
                <CardTitle className="text-xl">Profile</CardTitle>
                <CardDescription>
                    Manage your public identity and personal details.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 border-2 border-border/50 shadow-sm">
                        <AvatarImage src={user.pictureUrl} />
                        <AvatarFallback><User className="w-8 h-8 opacity-50" /></AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{user.name || "User"}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex gap-2">
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value)
                                setIsEditing(true)
                            }}
                            className="bg-background/50"
                            placeholder="Enter username"
                        />
                    </div>
                     <p className="text-xs text-muted-foreground">
                        This is your unique handle on Pixelstream.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t py-4 justify-end">
                <Button 
                    onClick={handleSave} 
                    disabled={!hasChanges || isSaving}
                >
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    )
}

function ProfileCardSkeleton() {
    return (
        <Card className="h-[300px] animate-pulse">
            <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-muted rounded-full" />
                    <div className="space-y-2">
                        <div className="h-5 w-32 bg-muted rounded" />
                        <div className="h-4 w-48 bg-muted rounded" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-10 w-full bg-muted rounded" />
                </div>
            </CardContent>
        </Card>
    )
}
