"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Settings, MessageCircle, Repeat2, Target, Bell } from "lucide-react"
import Link from "next/link"
import { TopNavigation } from "@/components/top-navigation"
import { BottomNavigation } from "@/components/bottom-navigation"
import { getCurrentUser, getUserProfile, getUserByUsername, getUserRetweets } from "@/lib/firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { XPProgressBar } from "@/components/xp-progress-bar"

interface UserProfile {
  uid: string
  username: string
  displayName?: string
  bio?: string
  profileImage?: string
  level: "Gold" | "Platinum" | "Diamante" | "Bronze" | "Prata"
  createdAt: any
  retweets?: number
  xp?: number
}

interface Retweet {
  id: string
  postId: string
  originalPost: {
    id: string
    content: string
    images: string[]
    videos: string[]
    authorDisplayName: string
    authorUsername: string
    authorProfileImage: string
    requiredLevel?: string
    createdAt: any
    likes: number
    comments: number
    retweets: number
  }
  createdAt: any
}

export default function UserProfile() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [userRetweets, setUserRetweets] = useState<Retweet[]>([])
  const [retweetsLoading, setRetweetsLoading] = useState(true)
  const { toast } = useToast()

  console.log("[v0] Loading profile for username:", username)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/")
          return
        }

        setCurrentUser(currentUser)

        const currentProfile = await getUserProfile(currentUser.uid)
        setCurrentUserProfile(currentProfile)

        const targetUser = await getUserByUsername(username)
        if (!targetUser) {
          toast({
            title: "Usuário não encontrado",
            description: "Este perfil não existe ou foi removido",
            variant: "destructive",
          })
          router.push("/feed")
          return
        }

        setProfileUser(targetUser)
        setIsOwnProfile(currentUser.uid === targetUser.uid)

        console.log("[v0] User profile found:", targetUser)
      } catch (error) {
        console.error("Error loading user data:", error)
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar o perfil do usuário",
          variant: "destructive",
        })
        router.push("/feed")
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      loadUserData()
    }
  }, [username, router, toast])

  useEffect(() => {
    const loadUserRetweets = async () => {
      if (!profileUser) return

      try {
        setRetweetsLoading(true)
        setUserRetweets([])
        const retweets = await getUserRetweets(profileUser.uid)
        setUserRetweets(retweets)
      } catch (error) {
        console.error("Error loading user retweets:", error)
      } finally {
        setRetweetsLoading(false)
      }
    }

    loadUserRetweets()
  }, [profileUser])

  const canUserRetweet = (postRequiredLevel?: string) => {
    if (!currentUserProfile) return false

    const userLevel = currentUserProfile.level.toLowerCase()

    const levelHierarchy = {
      bronze: 1,
      prata: 2,
      gold: 3,
      platinum: 4,
      diamante: 5,
    }

    const userLevelValue = levelHierarchy[userLevel as keyof typeof levelHierarchy] || 1
    const requiredLevelValue = levelHierarchy[postRequiredLevel?.toLowerCase() as keyof typeof levelHierarchy] || 1

    return userLevelValue >= requiredLevelValue
  }

  const canUserComment = () => {
    if (!currentUserProfile) return false

    const userLevel = currentUserProfile.level.toLowerCase()
    return ["gold", "platinum", "diamante"].includes(userLevel)
  }

  const canUserUseChat = () => {
    if (!currentUserProfile) return false

    const userLevel = currentUserProfile.level.toLowerCase()
    return ["platinum", "diamante"].includes(userLevel)
  }

  const handleMessage = () => {
    if (!profileUser) return

    if (!canUserUseChat()) {
      toast({
        title: "Acesso Platinum necessário",
        description: "Você precisa ser Platinum ou Diamante para enviar mensagens",
        variant: "destructive",
      })
      return
    }

    router.push(`/chat/${profileUser.username}`)
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "gold":
        return "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 text-yellow-400 border-yellow-500/40 shadow-lg shadow-yellow-500/20"
      case "platinum":
        return "bg-gradient-to-r from-purple-400/20 to-purple-600/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/20"
      case "diamante":
        return "bg-gradient-to-r from-blue-400/20 to-cyan-400/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/20"
      case "bronze":
        return "bg-gradient-to-r from-amber-600/20 to-amber-800/20 text-amber-400 border-amber-600/40 shadow-lg shadow-amber-600/20"
      case "prata":
        return "bg-gradient-to-r from-gray-300/20 to-gray-500/20 text-gray-300 border-gray-400/40 shadow-lg shadow-gray-400/20"
      default:
        return "bg-gradient-to-r from-gray-300/20 to-gray-500/20 text-gray-300 border-gray-400/40 shadow-lg shadow-gray-400/20"
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "Gold":
        return "🏆"
      case "Platinum":
        return "💎"
      case "Diamante":
        return "💠"
      case "Bronze":
        return "🥉"
      case "Prata":
        return "🥈"
      default:
        return "⭐"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation
        title={`@${profileUser.username}`}
        showBackButton={true}
        backHref="/feed"
        userProfile={currentUserProfile}
      />

      <main className="max-w-md mx-auto pb-20">
        {/* Profile Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-b-3xl" />

          <div className="relative p-6 space-y-6">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 ring-primary/30 shadow-lg">
                  <AvatarImage
                    src={
                      profileUser.profileImage ||
                      `/placeholder.svg?height=80&width=80&query=user profile ${profileUser.username || "/placeholder.svg"}`
                    }
                    alt={profileUser.displayName || profileUser.username}
                  />
                  <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                    {(profileUser.displayName || profileUser.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-xl font-bold">{profileUser.displayName || profileUser.username}</h1>
                  <p className="text-muted-foreground text-sm">@{profileUser.username}</p>
                </div>

                <Badge
                  variant="secondary"
                  className={`${getLevelBadgeColor(profileUser.level)} px-3 py-1 text-xs font-semibold rounded-full w-fit`}
                >
                  <span className="mr-1">{getLevelIcon(profileUser.level)}</span>
                  {profileUser.level}
                </Badge>
              </div>
            </div>

            {isOwnProfile && currentUserProfile && (
              <div className="bg-background/30 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <XPProgressBar currentXP={currentUserProfile.xp || 0} currentLevel={currentUserProfile.level} />
              </div>
            )}

            {profileUser.bio && (
              <div className="bg-background/30 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                <p className="text-sm text-foreground/90">{profileUser.bio}</p>
              </div>
            )}

            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2 bg-background/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-border/50">
                <Repeat2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{userRetweets.length}</span>
                <span className="text-xs text-muted-foreground">Retweets</span>
              </div>

              {isOwnProfile ? (
                <Link href="/settings" className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl bg-background/50 backdrop-blur-sm border-primary/30 hover:bg-primary/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Editar perfil
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleMessage}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl bg-background/50 backdrop-blur-sm border-primary/30 hover:bg-primary/10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mensagem
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {isOwnProfile && currentUserProfile && (
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-sm">Dicas de Progresso</span>
              </div>
              <div className="space-y-2 text-xs">
                {currentUserProfile.level === "Bronze" && (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <Target className="h-3 w-3 text-amber-400" />
                      <span className="text-amber-200">
                        Curta posts para ganhar XP e subir para Prata! (+100 XP por curtida)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        💡 Você precisa de 1000 XP para chegar ao nível Prata
                      </span>
                    </div>
                  </>
                )}
                {currentUserProfile.level === "Prata" && (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-gray-400/10 rounded-lg border border-gray-400/20">
                      <Target className="h-3 w-3 text-gray-300" />
                      <span className="text-gray-200">Agora você pode retuitar! (+150 XP por retweet)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        💡 Continue ganhando XP para chegar ao Gold (2500 XP total)
                      </span>
                    </div>
                  </>
                )}
                {currentUserProfile.level === "Gold" && (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <Target className="h-3 w-3 text-yellow-400" />
                      <span className="text-yellow-200">
                        Parabéns! Agora você pode comentar! (+200 XP por comentário)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        💎 Considere assinar o plano Platinum para chat exclusivo
                      </span>
                    </div>
                  </>
                )}
                {(currentUserProfile.level === "Platinum" || currentUserProfile.level === "Diamante") && (
                  <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Target className="h-3 w-3 text-purple-400" />
                    <span className="text-purple-200">
                      Você tem acesso completo! Use o chat exclusivo e todas as funcionalidades.
                    </span>
                  </div>
                )}
                {!["Bronze", "Prata", "Gold", "Platinum", "Diamante"].includes(currentUserProfile.level) && (
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-primary">
                      Continue interagindo na plataforma para ganhar XP e subir de nível!
                    </span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground/50 mt-2">
                  Nível atual: {currentUserProfile.level} | XP: {currentUserProfile.xp || 0}
                </div>
              </div>
            </div>
          )}

          <div className="bg-background/30 backdrop-blur-sm rounded-xl border border-border/50">
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Repeat2 className="h-5 w-5 text-primary" />
                <span>Retweets</span>
              </h2>

              {retweetsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2 text-sm">Carregando...</p>
                </div>
              ) : userRetweets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mb-3">
                    <Repeat2 className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">
                    {isOwnProfile ? "Nenhum retweet ainda" : `@${profileUser.username} não fez retweets`}
                  </p>
                  <p className="text-xs text-muted-foreground/70">Os retweets aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userRetweets.map((retweet) => (
                    <div key={retweet.id} className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground/70 px-2">
                        <Repeat2 className="h-3 w-3" />
                        <span>Retweetado por @{profileUser.username}</span>
                      </div>

                      {retweet.originalPost ? (
                        <div className="bg-background/50 border border-border/30 rounded-xl overflow-hidden">
                          <div className="p-4 space-y-3">
                            {/* Header do autor simplificado */}
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={retweet.originalPost.authorProfileImage || "/placeholder.svg"}
                                  alt={retweet.originalPost.authorDisplayName}
                                />
                                <AvatarFallback>
                                  {retweet.originalPost.authorDisplayName?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{retweet.originalPost.authorDisplayName}</p>
                                <p className="text-xs text-muted-foreground">@{retweet.originalPost.authorUsername}</p>
                              </div>
                            </div>

                            {/* Conteúdo do post */}
                            <p className="text-sm">{retweet.originalPost.content}</p>

                            {retweet.originalPost.images && retweet.originalPost.images.length > 0 && (
                              <div className="space-y-2">
                                {retweet.originalPost.images.map((image, index) => (
                                  <div key={index} className="w-full">
                                    <img
                                      src={image || "/placeholder.svg"}
                                      alt={`Imagem ${index + 1}`}
                                      className="w-full h-auto rounded-lg object-cover"
                                      style={{ maxHeight: "none" }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center space-x-6 text-xs text-muted-foreground pt-2">
                              <span>{retweet.originalPost.likes || 0} curtidas</span>
                              <span>{retweet.originalPost.comments || 0} comentários</span>
                              <span>{retweet.originalPost.retweets || 0} retweets</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                          <p className="text-sm text-muted-foreground">Post original não disponível</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation userProfile={currentUserProfile} />
    </div>
  )
}
