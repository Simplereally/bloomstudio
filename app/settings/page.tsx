"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/convex/_generated/api"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
    const currentUser = useQuery(api.users.getCurrentUser)
    const updateUsername = useMutation(api.users.updateUsername)
    const { theme, setTheme } = useTheme()

    const [username, setUsername] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Initialize username from user data
    useEffect(() => {
        if (currentUser?.username) {
            setUsername(currentUser.username)
        }
    }, [currentUser?.username])

    // Track changes
    useEffect(() => {
        const initialUsername = currentUser?.username ?? ""
        setHasChanges(username !== initialUsername && username.trim().length >= 3)
    }, [username, currentUser?.username])

    const handleSave = async () => {
        if (!hasChanges) return

        setIsSaving(true)
        try {
            await updateUsername({ username })
            toast.success("Username updated successfully!")
            setHasChanges(false)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update username"
            toast.error(message)
        } finally {
            setIsSaving(false)
        }
    }

    if (isAuthLoading) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <Card className="p-4">
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </Card>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <Card className="p-4">
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                        Please sign in to access settings.
                    </CardDescription>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto">
            <Card className="p-4">
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                    Configure your profile and preferences
                </CardDescription>
                <CardContent className="space-y-6 pt-6">
                    {/* Username */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="username">Username</Label>
                        <p className="text-sm text-muted-foreground">
                            This is your public display name shown on the community feed.
                        </p>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={30}
                        />
                        <p className="text-xs text-muted-foreground">
                            3-30 characters. Letters, numbers, and underscores only.
                        </p>
                    </div>

                    {/* Theme */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger id="theme">
                                <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}