"use client"

import { useState, useEffect } from "react"
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  toggleLike,
  toggleRetweet,
  checkUserLiked,
  checkUserRetweeted,
  checkContentAccess,
  getCurrentUserLevel,
} from "@/lib/firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PremiumContentOverlay } from "./premium-content-overlay"

interface PostCardProps {
  post: {
    id?: string
    authorId: string
    authorUsername: string
    authorDisplayName: string
    authorProfileImage: string
    content: string
    images: string[]
    videos: string[]
    likes: number
    comments: number
    retweets: number
    requiredLevel?: "Gold" | "Premium" | "Diamante" | "Platinum" | "Bronze"
    createdAt: any
  }
  onLike?: (postId: string, newCount: number) => void
  onRetweet?: (postId: string, newCount: number) => void
}

export function PostCard({ post, onLike, onRetweet }: PostCardProps) {
  const [user] = useAuthState(auth)
  const [liked, setLiked] = useState(false)
  const [retweeted, setRetweeted] = useState(false)
  const [userLevel, setUserLevel] = useState<string>("bronze")
  const [hasAccess, setHasAccess] = useState(true)

  useEffect(() => {
    const checkUserAccess = async () => {
      if (user) {
        const level = await getCurrentUserLevel(user.uid)
        setUserLevel(level)

        if (post.requiredLevel) {
          const access = checkContentAccess(level, post.requiredLevel)
          setHasAccess(access)
        }
      }
    }

    checkUserAccess()
  }, [user, post.requiredLevel])

  useEffect(() => {
    const checkInteractions = async () => {
      if (user && post.id) {
        const [userLiked, userRetweeted] = await Promise.all([
          checkUserLiked(user.uid, post.id),
          checkUserRetweeted(user.uid, post.id),
        ])
        setLiked(userLiked)
        setRetweeted(userRetweeted)
      }
    }

    checkInteractions()
  }, [user, post.id])

  const handleLike = async () => {
    if (!user || !post.id) return

    try {
      const newLikedState = await toggleLike(user.uid, post.id)
      setLiked(newLikedState)

      const newCount = newLikedState ? post.likes + 1 : post.likes - 1
      onLike?.(post.id, newCount)
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleRetweet = async () => {
    if (!user || !post.id) return

    try {
      const newRetweetedState = await toggleRetweet(user.uid, post.id, post.authorId)
      setRetweeted(newRetweetedState)

      const newCount = newRetweetedState ? post.retweets + 1 : post.retweets - 1
      onRetweet?.(post.id, newCount)
    } catch (error) {
      console.error("Error toggling retweet:", error)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ptBR,
      })
    } catch (error) {
      return ""
    }
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "premium":
      case "platinum":
        return "bg-purple-500 text-white"
      case "diamante":
        return "bg-blue-500 text-white"
      case "gold":
        return "bg-amber-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <Card className="border-gray-800 bg-black">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.authorProfileImage || "/placeholder.svg"} alt={post.authorDisplayName} />
            <AvatarFallback>{post.authorDisplayName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white text-sm">{post.authorDisplayName}</h3>
              <span className="text-gray-500 text-xs">@{post.authorUsername}</span>
              <span className="text-gray-500 text-xs">·</span>
              <span className="text-gray-500 text-xs">{formatDate(post.createdAt)}</span>

              {post.requiredLevel && post.requiredLevel.toLowerCase() !== "gold" && (
                <Badge className={getLevelBadgeColor(post.requiredLevel)}>{post.requiredLevel}</Badge>
              )}
            </div>

            <div className="mt-2">
              <p className="text-white whitespace-pre-wrap text-sm">{post.content}</p>

              <div className="relative">
                {post.images.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-1">
                    {post.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Post image ${index + 1}`}
                          className="rounded-lg max-w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {post.videos.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-1">
                    {post.videos.map((video, index) => (
                      <div key={index} className="relative">
                        <video src={video} controls className="rounded-lg max-w-full h-auto" />
                      </div>
                    ))}
                  </div>
                )}

                {!hasAccess && post.requiredLevel && post.requiredLevel.toLowerCase() !== "gold" && (
                  <PremiumContentOverlay requiredLevel={post.requiredLevel} userLevel={userLevel} />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 max-w-md">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-400 hover:bg-blue-400/10">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">{post.comments}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetweet}
                className={`text-gray-500 hover:text-green-400 hover:bg-green-400/10 ${
                  retweeted ? "text-green-400" : ""
                }`}
              >
                <Repeat2 className="h-4 w-4 mr-1" />
                <span className="text-sm">{post.retweets}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`text-gray-500 hover:text-red-400 hover:bg-red-400/10 ${liked ? "text-red-400" : ""}`}
              >
                <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
                <span className="text-sm">{post.likes}</span>
              </Button>

              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-400 hover:bg-blue-400/10">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
