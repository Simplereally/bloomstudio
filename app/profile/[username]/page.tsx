"use client"

import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useProfileImages } from "@/hooks/queries/use-image-history"
import { useMutation, useQuery } from "convex/react"
import { Loader2, Plus, UserCheck } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
    const params = useParams()
    const username = params.username as string

    // Fetch user profile
    const userProfile = useQuery(api.users.getUserProfile, { username })

    // Fetch images
    const { results, status, loadMore } = useProfileImages(username)

    // Auto-load more if we got an empty page but aren't done
    useEffect(() => {
        if (status === "CanLoadMore" && results.length === 0) {
            loadMore(20)
        }
    }, [status, results.length, loadMore])

    if (userProfile === undefined) {
        return <ProfileSkeleton />
    }

    if (userProfile === null) {
        return <ProfileNotFound />
    }

    return (
        <div className="min-h-screen pt-4 pb-4">
            <div className="container mx-auto px-4 space-y-4">
                {/* Compact Header */}
                <div className="flex items-center gap-4 py-2">
                    <Avatar className="h-12 w-12 border border-primary/20 shrink-0">
                        <AvatarImage src={userProfile.pictureUrl} alt={userProfile.username} />
                        <AvatarFallback className="text-sm">
                            {userProfile.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold truncate">{userProfile.username}</h1>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span><span className="font-semibold text-foreground">{userProfile.imagesCount ?? 0}</span> creations</span>
                            <span><span className="font-semibold text-foreground">{userProfile.followersCount ?? 0}</span> followers</span>
                            <span><span className="font-semibold text-foreground">{userProfile.followingCount ?? 0}</span> following</span>
                        </div>
                    </div>

                    <FollowButton followeeId={userProfile.clerkId} />
                </div>

                {/* Grid - the hero */}
                <div className="border-t border-border/40 pt-4">
                    <PaginatedImageGrid
                        images={results}
                        status={status}
                        loadMore={loadMore}
                        showUser={false} // Don't show user badge on their own profile
                        emptyState={
                            <div className="text-center py-20 text-muted-foreground">
                                This user hasn&apos;t shared any public images yet.
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    )
}

function FollowButton({ followeeId }: { followeeId: string }) {
    const currentUser = useQuery(api.users.getCurrentUser)
    const isFollowing = useQuery(api.follows.isFollowing, { followeeId })
    const follow = useMutation(api.follows.follow)
    const unfollow = useMutation(api.follows.unfollow)
    const [isLoading, setIsLoading] = useState(false)

    const isSelf = currentUser?.clerkId === followeeId

    if (isSelf) return null
    if (isFollowing === undefined) return <Button disabled variant="outline" className="w-32"><Loader2 className="h-4 w-4 animate-spin" /></Button>

    const handleFollowToggle = async () => {
        setIsLoading(true)
        try {
            if (isFollowing) {
                await unfollow({ followeeId })
                toast.success("Unfollowed")
            } else {
                await follow({ followeeId })
                toast.success("Followed")
            }
        } catch (error) {
            toast.error("Failed to update follow status")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant={isFollowing ? "secondary" : "default"}
            className="w-32 rounded-full font-medium"
            onClick={handleFollowToggle}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Following
                </>
            ) : (
                <>
                    <Plus className="mr-2 h-4 w-4" />
                    Follow
                </>
            )}
        </Button>
    )
}

function ProfileSkeleton() {
    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="container mx-auto px-4 space-y-12">
                <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    )
}

function ProfileNotFound() {
    return (
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl font-bold mb-4">User not found</h1>
            <p className="text-muted-foreground mb-8">The user you are looking for does not exist.</p>
            <Button asChild>
                <Link href="/feed">Back to Feed</Link>
            </Button>
        </div>
    )
}
