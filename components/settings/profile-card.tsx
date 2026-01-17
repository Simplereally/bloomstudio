"use client"

import { useActionState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User, Mail, AtSign } from "lucide-react"
import { toast } from "sonner"

export function ProfileCard() {
    const user = useQuery(api.users.getCurrentUser)
    
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

    const [, formAction, isPending] = useActionState(async (_prev: unknown, formData: FormData) => {
        const username = (formData.get("username") as string).trim()
        
        if (!username || username === user?.username) return null
        
        try {
            await updateUsernameMutation({ username })
            toast.success("Username updated successfully")
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
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
                    <CardDescription className="text-base text-muted-foreground/80">
                        Manage your public identity and personal details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* User Info Header */}
                    <div className="flex flex-col sm:flex-row items-center gap-8 p-4 rounded-xl bg-muted/20 border border-border/40">
                        <div className="relative group">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                <AvatarImage src={user.pictureUrl} className="object-cover" />
                                <AvatarFallback className="bg-primary/5 text-primary">
                                    <User className="w-10 h-10" />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-3 text-center sm:text-left">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight">{user.name || "User"}</h3>
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-1">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{user.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Username Input */}
                    <div className="grid gap-6 max-w-md">
                        <div className="space-y-3">
                            <Label htmlFor="username" className="text-base font-semibold flex items-center gap-2">
                                <AtSign className="w-4 h-4 text-primary" />
                                Username
                            </Label>
                            <div className="relative group">
                                <Input
                                    id="username"
                                    name="username"
                                    defaultValue={user.username ?? ""}
                                    key={user.username}
                                    className="bg-background/50 border-border/60 focus:border-primary/50 transition-all duration-200 h-11 pl-4 pr-10"
                                    placeholder="your_handle"
                                    required
                                    minLength={3}
                                    maxLength={30}
                                    pattern="^[a-zA-Z0-9_]+$"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
                                    <AtSign className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                This is your unique handle on Bloom Studio. It will be used in your profile URL and when others mention you.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button 
                            type="submit" 
                            disabled={isPending}
                            className="min-w-[140px] shadow-lg shadow-primary/20 font-semibold h-11"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}

function ProfileCardSkeleton() {
    return (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader>
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded mt-2 animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/20 border border-border/40">
                    <div className="w-24 h-24 bg-muted rounded-full animate-pulse" />
                    <div className="space-y-3">
                        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-11 w-full bg-muted rounded animate-pulse" />
                </div>
            </CardContent>
        </Card>
    )
}
