"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, MoreHorizontal, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import {
  getPostsPaginated,
  checkUserLikedBatch,
  toggleLike,
  toggleRetweet,
  getUserProfile,
  checkUserRetweetedBatch,
  getCurrentUserLevel,
  checkContentAccess,
  type Post,
} from "@/lib/firebase/firestore"
import { CommentModal } from "@/components/comment-modal"
import { PremiumContentOverlay } from "@/components/premium-content-overlay"
import { useRealTime } from "@/components/real-time-provider"
import { useToast } from "@/components/toast-provider"
import { BottomNavigation } from "@/components/bottom-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { XPNotification } from "@/components/xp-notification"

export default function FeedPage() {
  const [user] = useAuthState(auth)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [retweetedPosts, setRetweetedPosts] = useState<Set<string>>(new Set())
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userLevel, setUserLevel] = useState<"Gold" | "Premium" | "Diamante">("Gold")

  const [xpNotification, setXpNotification] = useState({
    show: false,
    xpGained: 0,
    action: "",
  })

  const { newPostsCount, hasNewNotifications, markPostsAsRead, markNotificationsAsRead } = useRealTime()
  const { showWarning, showError, showSuccess } = useToast()

  useEffect(() => {
    const unsubscribe = getPostsPaginated(
      (fetchedPosts, hasMorePosts) => {
        setPosts(fetchedPosts)
        setHasMore(hasMorePosts)
        setLoading(false)

        if (fetchedPosts.length > 0) {
          setLastDoc(fetchedPosts[fetchedPosts.length - 1])
        }
      },
      undefined,
      8,
    ) // Carrega apenas 8 posts inicialmente

    return unsubscribe
  }, [])

  useEffect(() => {
    const checkLikedPostsOptimized = async () => {
      if (!user || posts.length === 0) return

      const postIds = posts.map((post) => post.id).filter(Boolean) as string[]
      if (postIds.length === 0) return

      try {
        const likedSet = await checkUserLikedBatch(user.uid, postIds)
        setLikedPosts(likedSet)
      } catch (error) {
        console.error("[v0] Error checking liked posts:", error)
      }
    }

    checkLikedPostsOptimized()
  }, [user, posts])

  useEffect(() => {
    const checkRetweetedPostsOptimized = async () => {
      if (!user || posts.length === 0) return

      const postIds = posts.map((post) => post.id).filter(Boolean) as string[]
      if (postIds.length === 0) return

      try {
        const retweetedSet = await checkUserRetweetedBatch(user.uid, postIds)
        setRetweetedPosts(retweetedSet)
      } catch (error) {
        console.error("[v0] Error checking retweeted posts:", error)
      }
    }

    checkRetweetedPostsOptimized()
  }, [user, posts])

  useEffect(() => {
    const handleScroll = () => {
      if (newPostsCount > 0) {
        markPostsAsRead()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [newPostsCount, markPostsAsRead])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        const profile = await getUserProfile(user.uid)
        console.log("[v0] User profile loaded:", profile)
        setUserProfile(profile)

        const level = await getCurrentUserLevel(user.uid)
        setUserLevel(level)
        console.log("[v0] User level:", level)
      } catch (error) {
        console.error("[v0] Error loading user profile:", error)
      }
    }

    fetchUserProfile()
  }, [user])

  const handleLike = async (postId: string) => {
    if (!user) {
      showWarning("Login necessário", "Você precisa estar logado para curtir posts")
      return
    }

    if (!userProfile) {
      showError("Erro", "Perfil do usuário não carregado")
      return
    }

    try {
      const result = await toggleLike(user.uid, postId)

      if (result.liked) {
        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.add(postId)
          return newSet
        })

        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post)),
        )

        if (result.xpGained > 0) {
          setXpNotification({
            show: true,
            xpGained: result.xpGained,
            action: "like",
          })
        }
      } else {
        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })

        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === postId ? { ...post, likes: (post.likes || 0) - 1 } : post)),
        )
      }
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
      const errorMessage = error instanceof Error ? error.message : "Não foi possível curtir o post"
      showError("Erro ao curtir", errorMessage)
    }
  }

  const handleComment = (postId: string) => {
    if (!user) {
      showWarning("Login necessário", "Você precisa estar logado para comentar")
      return
    }

    if (!userProfile) {
      showError("Erro", "Perfil do usuário não carregado")
      return
    }

    const userLevel = userProfile.level || "bronze"
    const levelHierarchy = ["bronze", "prata", "gold", "platinum", "diamante"]
    const userLevelIndex = levelHierarchy.indexOf(userLevel.toLowerCase())

    if (userLevelIndex < 2) {
      showWarning(
        "Nível insuficiente",
        "Você precisa ser nível Gold ou superior para comentar. Curta mais posts para subir de nível!",
      )
      return
    }

    setSelectedPostId(postId)
    setCommentModalOpen(true)
  }

  const handleShare = async (postId: string) => {
    if (!user) {
      showWarning("Login necessário", "Você precisa estar logado para retuitar")
      return
    }

    if (!userProfile) {
      showError("Erro", "Perfil do usuário não carregado")
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const result = await toggleRetweet(user.uid, postId, post.authorId)

      if (result.retweeted) {
        setRetweetedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.add(postId)
          return newSet
        })

        showSuccess("Post retuitado!", "O post foi adicionado ao seu perfil")

        if (result.xpGained > 0) {
          setXpNotification({
            show: true,
            xpGained: result.xpGained,
            action: "retweet",
          })
        }
      } else {
        setRetweetedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })

        showSuccess("Retweet removido", "O post foi removido do seu perfil")
      }
    } catch (error) {
      console.error("[v0] Error toggling retweet:", error)
      const errorMessage = error instanceof Error ? error.message : "Não foi possível retuitar o post"
      showError("Erro ao retuitar", errorMessage)
    }
  }

  const handleCommentAdded = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post)),
    )
  }

  const handleRefresh = () => {
    markPostsAsRead()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const formatNumber = useMemo(
    () => (num: number) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`
      }
      return num.toString()
    },
    [],
  )

  const formatTimestamp = useMemo(
    () => (timestamp: any) => {
      if (!timestamp) return "agora"

      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return "agora"
        if (diffInMinutes < 60) return `${diffInMinutes}m`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
        return `${Math.floor(diffInMinutes / 1440)}d`
      } catch (error) {
        return "agora"
      }
    },
    [],
  )

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)

    try {
      const unsubscribe = getPostsPaginated(
        (newPosts, hasMorePosts) => {
          setPosts((prevPosts) => [...prevPosts, ...newPosts])
          setHasMore(hasMorePosts)
          setLoadingMore(false)

          if (newPosts.length > 0) {
            setLastDoc(newPosts[newPosts.length - 1])
          }

          unsubscribe() // Unsubscribe após carregar
        },
        lastDoc,
        8,
      )
    } catch (error) {
      console.error("[v0] Error loading more posts:", error)
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, lastDoc])

  const hasContentAccess = (requiredLevel?: string) => {
    if (!requiredLevel || requiredLevel === "Gold") return true
    return checkContentAccess(userLevel, requiredLevel)
  }

  const canUserLike = (userLevel: string) => {
    return true
  }

  const canUserComment = (userLevel: string) => {
    const levelHierarchy = ["bronze", "prata", "gold", "platinum", "diamante"]
    const userLevelIndex = levelHierarchy.indexOf(userLevel.toLowerCase())
    return userLevelIndex >= 2
  }

  const canUserRetweet = (userLevel: string) => {
    const levelHierarchy = ["bronze", "prata", "gold", "platinum", "diamante"]
    const userLevelIndex = levelHierarchy.indexOf(userLevel.toLowerCase())
    return userLevelIndex >= 1
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation userProfile={userProfile} />

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando posts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation userProfile={userProfile} />

      {newPostsCount > 0 && (
        <div className="sticky top-16 z-40 bg-primary/10 border-b border-primary/20">
          <div className="max-w-md mx-auto p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:bg-primary/20"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {newPostsCount} novo{newPostsCount > 1 ? "s" : ""} post{newPostsCount > 1 ? "s" : ""} • Clique para ver
            </Button>
          </div>
        </div>
      )}

      <XPNotification
        show={xpNotification.show}
        xpGained={xpNotification.xpGained}
        action={xpNotification.action}
        onClose={() => setXpNotification({ show: false, xpGained: 0, action: "" })}
      />

      {/* Feed */}
      <main className="max-w-md mx-auto pb-20">
        {posts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhum post encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Os posts da Isabelle aparecerão aqui quando forem publicados
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-border/50 fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile/isabellelua"
                      className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarImage
                          src={post.authorProfileImage || "/beautiful-woman-profile.png"}
                          alt={post.authorDisplayName}
                        />
                        <AvatarFallback>IL</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-1">
                          <h3 className="font-semibold text-sm">{post.authorDisplayName}</h3>
                          <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-xs">✓</span>
                          </div>
                          {post.requiredLevel && post.requiredLevel !== "Gold" && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                post.requiredLevel === "Premium"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {post.requiredLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          @{post.authorUsername} • {formatTimestamp(post.createdAt)}
                        </p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="relative">
                    <div className={!hasContentAccess(post.requiredLevel) ? "filter blur-md" : ""}>
                      <p className="text-sm mb-3 leading-relaxed">{post.content}</p>

                      {post.images && post.images.length > 0 && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img
                            src={post.images[0] || "/placeholder.svg"}
                            alt="Post content"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {!hasContentAccess(post.requiredLevel) && post.requiredLevel && (
                      <PremiumContentOverlay
                        requiredLevel={post.requiredLevel as "Gold" | "Premium" | "Diamante"}
                        userLevel={userLevel}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full p-2 ${
                          post.id && likedPosts.has(post.id) ? "text-red-500" : "text-muted-foreground"
                        } hover:text-red-500 transition-colors`}
                        onClick={() => post.id && handleLike(post.id)}
                      >
                        <Heart className={`h-5 w-5 ${post.id && likedPosts.has(post.id) ? "fill-current" : ""}`} />
                        <span className="ml-1 text-xs">{formatNumber(post.likes || 0)}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full p-2 transition-colors ${
                          userProfile && canUserComment(userProfile.level)
                            ? "text-muted-foreground hover:text-primary"
                            : "text-muted-foreground/50 cursor-not-allowed"
                        }`}
                        onClick={() => post.id && handleComment(post.id)}
                        disabled={!userProfile || !canUserComment(userProfile.level)}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="ml-1 text-xs">{formatNumber(post.comments || 0)}</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full p-2 transition-colors ${
                        userProfile && canUserRetweet(userProfile.level)
                          ? post.id && retweetedPosts.has(post.id)
                            ? "text-green-500"
                            : "text-muted-foreground hover:text-green-500"
                          : "text-muted-foreground/50 cursor-not-allowed"
                      }`}
                      onClick={() => post.id && handleShare(post.id)}
                      disabled={!userProfile || !canUserRetweet(userProfile.level)}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {posts.length > 0 && hasMore && (
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full rounded-full border-border hover:bg-secondary bg-transparent"
              onClick={loadMorePosts}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Carregando...
                </>
              ) : (
                "Carregar mais posts"
              )}
            </Button>
          </div>
        )}
      </main>

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => {
          setCommentModalOpen(false)
          setSelectedPostId(null)
        }}
        postId={selectedPostId}
        onCommentAdded={handleCommentAdded}
      />

      <BottomNavigation userProfile={userProfile} />
    </div>
  )
}
