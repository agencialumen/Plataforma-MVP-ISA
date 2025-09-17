"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, MessageCircle, Heart, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getPostsByAuthor,
  getIsabelleProfile,
  checkUserLiked,
  toggleLike,
  toggleRetweet,
  checkUserRetweeted,
  getCurrentUserLevel,
  checkContentAccess,
  getUserProfile,
  getIsabelleStories,
} from "@/lib/firebase/firestore"
import { BottomNavigation } from "@/components/bottom-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { PremiumContentOverlay } from "@/components/premium-content-overlay"
import { CommentModal } from "@/components/comment-modal"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

interface FirebasePost {
  id: string
  content: string
  images: string[]
  videos: string[]
  likes: number
  comments: number
  createdAt: any
  requiredLevel?: string
}

interface IsabelleProfile {
  displayName: string
  bio: string
  profileImage: string
  socialLinks?: {
    youtube?: string
    tiktok?: string
    instagram?: string
    twitter?: string
  }
  shortCover?: string
}

interface Story {
  id: string
  name: string
  coverImage: string
  requiredLevel: "Bronze" | "Prata" | "Gold" | "Diamante"
  images: string[]
  createdAt: any
}

export default function IsabelleLuaProfile() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts")
  const [posts, setPosts] = useState<FirebasePost[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<IsabelleProfile | null>(null)
  const [user] = useAuthState(auth)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [retweetedPosts, setRetweetedPosts] = useState<Set<string>>(new Set())
  const [userLevel, setUserLevel] = useState<"Gold" | "Premium" | "Diamante">("Gold")
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [storyModalOpen, setStoryModalOpen] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("[v0] Getting posts by author: isabellelua")
        const isabellePosts = await getPostsByAuthor("isabellelua")
        const isabelleProfile = await getIsabelleProfile()
        const isabelleStories = await getIsabelleStories()

        setPosts(isabellePosts)
        setProfile(isabelleProfile)
        setStories(isabelleStories)

        if (user) {
          const currentProfile = await getUserProfile(user.uid)
          setCurrentUserProfile(currentProfile)
          console.log("[v0] User profile loaded:", currentProfile)

          if (currentProfile) {
            const level = await getCurrentUserLevel(user.uid)
            setUserLevel(level)
            console.log("[v0] User level:", level)
          }
        }
      } catch (error) {
        console.error("Error loading Isabelle data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useEffect(() => {
    const checkLikedPosts = async () => {
      if (!user || posts.length === 0) return

      const likedSet = new Set<string>()
      for (const post of posts) {
        if (post.id) {
          const isLiked = await checkUserLiked(user.uid, post.id)
          if (isLiked) {
            likedSet.add(post.id)
          }
        }
      }
      setLikedPosts(likedSet)
    }

    checkLikedPosts()
  }, [user, posts])

  useEffect(() => {
    const checkRetweetedPosts = async () => {
      if (!user || posts.length === 0) return

      const retweetedSet = new Set<string>()
      for (const post of posts) {
        if (post.id) {
          const isRetweeted = await checkUserRetweeted(user.uid, post.id)
          if (isRetweeted) {
            retweetedSet.add(post.id)
          }
        }
      }
      setRetweetedPosts(retweetedSet)
    }

    checkRetweetedPosts()
  }, [user, posts])

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir posts",
        variant: "destructive",
      })
      return
    }

    try {
      const wasLiked = await toggleLike(user.uid, postId)

      setLikedPosts((prev) => {
        const newSet = new Set(prev)
        if (wasLiked) {
          newSet.add(postId)
        } else {
          newSet.delete(postId)
        }
        return newSet
      })

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: (post.likes || 0) + (wasLiked ? 1 : -1) } : post,
        ),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Erro ao curtir",
        description: "Não foi possível curtir o post. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleComment = (postId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar",
        variant: "destructive",
      })
      return
    }

    setSelectedPostId(postId)
    setCommentModalOpen(true)
  }

  const handleShare = async (postId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para retuitar",
        variant: "destructive",
      })
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const wasRetweeted = await toggleRetweet(user.uid, postId, "isabellelua")

      setRetweetedPosts((prev) => {
        const newSet = new Set(prev)
        if (wasRetweeted) {
          newSet.add(postId)
        } else {
          newSet.delete(postId)
        }
        return newSet
      })

      toast({
        title: wasRetweeted ? "Post retuitado!" : "Retweet removido",
        description: wasRetweeted ? "O post foi adicionado ao seu perfil" : "O post foi removido do seu perfil",
      })
    } catch (error) {
      console.error("Error toggling retweet:", error)
      toast({
        title: "Erro ao retuitar",
        description: "Não foi possível retuitar o post. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCommentAdded = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post)),
    )
  }

  const hasContentAccess = (requiredLevel?: string) => {
    if (!requiredLevel || requiredLevel === "Gold") return true
    return checkContentAccess(userLevel, requiredLevel)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatTimestamp = (timestamp: any) => {
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
  }

  const hasStoryAccess = (requiredLevel: "Bronze" | "Prata" | "Gold" | "Diamante") => {
    const levelHierarchy = { Bronze: 1, Prata: 2, Gold: 3, Diamante: 4 }
    const userLevelValue = levelHierarchy[userLevel as keyof typeof levelHierarchy] || 3
    const requiredLevelValue = levelHierarchy[requiredLevel]
    return userLevelValue >= requiredLevelValue
  }

  const handleStoryClick = (story: Story) => {
    if (!hasStoryAccess(story.requiredLevel)) {
      toast({
        title: "Acesso restrito",
        description: `Este destaque é exclusivo para usuários ${story.requiredLevel} ou superior`,
        variant: "destructive",
      })
      return
    }
    setSelectedStory(story)
    setStoryModalOpen(true)
  }

  const getStoryBadgeColor = (level: "Bronze" | "Prata" | "Gold" | "Diamante") => {
    switch (level) {
      case "Bronze":
        return "from-amber-600 to-amber-800"
      case "Prata":
        return "from-gray-400 to-gray-600"
      case "Gold":
        return "from-yellow-400 to-yellow-600"
      case "Diamante":
        return "from-blue-400 to-blue-600"
      default:
        return "from-primary to-primary/60"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation title="@isabellelua" showBackButton={true} backHref="/feed" userProfile={currentUserProfile} />

      <main className="w-full max-w-md mx-auto">
        <div className="p-4 sm:p-6 space-y-4">
          {profile?.shortCover && (
            <div className="rounded-lg overflow-hidden -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4">
              <img
                src={profile.shortCover || "/placeholder.svg"}
                alt="Capa do perfil"
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-primary/20">
              <AvatarImage src={profile?.profileImage || "/beautiful-woman-profile.png"} alt="Isabelle Lua" />
              <AvatarFallback className="text-xl sm:text-2xl font-bold">IL</AvatarFallback>
            </Avatar>

            <div className="flex space-x-2">
              {currentUserProfile?.username === "isabellelua" ? (
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  className="rounded-full bg-transparent"
                  onClick={() => router.push("/settings")}
                >
                  Editar perfil
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-400/30 hover:border-pink-400/50 hover:from-pink-500/30 hover:to-purple-500/30 transition-all duration-300"
                    onClick={() => {
                      router.push("/chat/isabellelua")
                    }}
                  >
                    <MessageCircle className="h-4 w-4 text-pink-400" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold">{profile?.displayName || "Isabelle Lua"}</h2>
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {profile?.bio ||
                "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium\n📧 Contato: isabelle@deluxeisa.com"}
            </p>
          </div>

          {currentUserProfile?.username !== "isabellelua" && (
            <div className="w-full">
              <Button
                className="w-full bg-transparent border-2 border-pink-400/30 hover:border-pink-400/50 text-pink-400 hover:text-pink-300 font-medium py-3 px-6 rounded-full backdrop-blur-sm hover:bg-pink-400/5 transition-all duration-300 text-base"
                variant="outline"
                onClick={() => {
                  router.push("/checkout")
                }}
              >
                Assinar Agora
              </Button>
            </div>
          )}

          <div className="flex justify-around py-3 sm:py-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold">{posts.length}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
          </div>

          <div className="flex space-x-3 sm:space-x-4 py-2 overflow-x-auto">
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer"
                onClick={() => handleStoryClick(story)}
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${getStoryBadgeColor(story.requiredLevel)} p-0.5 relative`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src={story.coverImage || "/placeholder.svg?height=64&width=64"}
                      alt={story.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${getStoryBadgeColor(story.requiredLevel)} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {story.requiredLevel[0]}
                  </div>
                  {!hasStoryAccess(story.requiredLevel) && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔒</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground max-w-[60px] truncate">{story.name}</span>
              </div>
            ))}
          </div>

          {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex justify-center space-x-4 py-3">
              {profile.socialLinks.youtube && (
                <a
                  href={profile.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <span className="text-white text-sm font-bold">YT</span>
                </a>
              )}
              {profile.socialLinks.tiktok && (
                <a
                  href={profile.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <span className="text-white text-sm font-bold">TT</span>
                </a>
              )}
              {profile.socialLinks.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <span className="text-white text-sm font-bold">IG</span>
                </a>
              )}
              {profile.socialLinks.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <span className="text-white text-sm font-bold">X</span>
                </a>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border">
          <div className="flex">
            <Button
              variant="ghost"
              className={`flex-1 py-2 sm:py-3 rounded-none border-b-2 text-sm sm:text-base ${
                activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setActiveTab("posts")}
            >
              Posts
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 py-2 sm:py-3 rounded-none border-b-2 text-sm sm:text-base ${
                activeTab === "saved" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setActiveTab("saved")}
            >
              Salvos
            </Button>
          </div>
        </div>

        <div className="pb-20">
          {loading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-4xl">📝</div>
              <div className="text-lg font-semibold">Nenhum post ainda</div>
              <div className="text-sm text-muted-foreground">Os posts da Isabelle aparecerão aqui</div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {posts.map((post) => (
                <Card key={post.id} className="border-border/50 fade-in">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage
                            src={profile?.profileImage || "/beautiful-woman-profile.png"}
                            alt="Isabelle Lua"
                          />
                          <AvatarFallback>IL</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-1">
                            <h3 className="font-semibold text-sm">{profile?.displayName || "Isabelle Lua"}</h3>
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
                            @isabellelua • {formatTimestamp(post.createdAt)}
                          </p>
                        </div>
                      </div>
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

                        {post.videos && post.videos.length > 0 && (
                          <div className="mb-4 rounded-lg overflow-hidden">
                            <video src={post.videos[0]} controls className="w-full h-auto object-cover" />
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
                          className="rounded-full p-2 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => post.id && handleComment(post.id)}
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="ml-1 text-xs">{formatNumber(post.comments || 0)}</span>
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full p-2 ${
                          post.id && retweetedPosts.has(post.id) ? "text-green-500" : "text-muted-foreground"
                        } hover:text-green-500 transition-colors`}
                        onClick={() => post.id && handleShare(post.id)}
                      >
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {posts.length > 0 && (
            <div className="p-4">
              <Button variant="outline" className="w-full rounded-full border-border hover:bg-secondary bg-transparent">
                Ver mais posts
              </Button>
            </div>
          )}
        </div>
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

      {selectedStory && (
        <div
          className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${storyModalOpen ? "block" : "hidden"}`}
          onClick={() => setStoryModalOpen(false)}
        >
          <div className="relative w-full max-w-sm mx-4">
            <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
              {selectedStory.images.length > 0 && (
                <img
                  src={selectedStory.images[0] || "/placeholder.svg"}
                  alt={selectedStory.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.profileImage || "/beautiful-woman-profile.png"} alt="Isabelle Lua" />
                  <AvatarFallback>IL</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm font-medium">{selectedStory.name}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getStoryBadgeColor(selectedStory.requiredLevel)} text-white`}
                >
                  {selectedStory.requiredLevel}
                </span>
              </div>
              <button onClick={() => setStoryModalOpen(false)} className="text-white text-xl font-bold">
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation userProfile={currentUserProfile} />
    </div>
  )
}
