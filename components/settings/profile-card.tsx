"use client"

import { useActionState } from "react"
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
    
    // Mutation with optimistic update to handle instant UI changes
    const updateUsernameMutation = useMutation(api.users.updateUsername).withOptimisticUpdate(
        (localStore, { username }) => {
            const currentUser = localStore.getQuery(api.users.getCurrentUser, {})
            if (currentUser) {
                localStore.setQuery(api.users.getCurrentUser, {}, {
                    ...currentUser,
                    username,
                })
            }
        }
    )

    // React 19 Action to handle form submission and pending states
    const [, formAction, isPending] = useActionState(async (_prev: unknown, formData: FormData) => {
        const username = (formData.get("username") as string).trim()
        
        // Skip if no change or empty
        if (!username || username === user?.username) return null
        
        try {
            await updateUsernameMutation({ username })
            toast.success("Username updated")
            return null
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update profile")
            return error instanceof Error ? error.message : "Unknown error"
        }
    }, null)

    if (!user) {
        return <ProfileCardSkeleton />
    }

    return (
        <form action={formAction}>
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
                                name="username"
                                defaultValue={user.username ?? ""}
                                key={user.username}
                                className="bg-background/50"
                                placeholder="Enter username"
                                required
                                minLength={3}
                                maxLength={30}
                                pattern="^[a-zA-Z0-9_]+$"
                            />
                        </div>
                         <p className="text-xs text-muted-foreground">
                            This is your unique handle on Pixelstream.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t py-4 justify-end">
                    <Button 
                        type="submit" 
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </form>
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
