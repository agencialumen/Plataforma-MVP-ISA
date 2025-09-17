"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Bell, User, X, MessageCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  getIsabelleProfile,
  getCurrentUserLevel,
  getActiveUserNotifications,
  markNotificationAsRead,
  cleanExpiredNotifications,
  type Notification,
} from "@/lib/firebase/firestore"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"

interface BottomNavigationProps {
  userProfile?: {
    uid: string
    username: string
  } | null
}

export function BottomNavigation({ userProfile }: BottomNavigationProps) {
  const pathname = usePathname()
  const [user] = useAuthState(auth)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isabelleProfile, setIsabelleProfile] = useState<any>(null)
  const [userLevel, setUserLevel] = useState<string>("Bronze")
  const [hasNewChatMessages, setHasNewChatMessages] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    const loadIsabelleProfile = async () => {
      try {
        const profile = await getIsabelleProfile()
        setIsabelleProfile(profile)
      } catch (error) {
        console.error("Error loading Isabelle profile:", error)
      }
    }
    loadIsabelleProfile()
  }, [])

  useEffect(() => {
    const fetchUserLevel = async () => {
      if (!user) return

      try {
        const level = await getCurrentUserLevel(user.uid)
        setUserLevel(level)
      } catch (error) {
        console.error("Error fetching user level:", error)
      }
    }

    fetchUserLevel()
  }, [user])

  useEffect(() => {
    if (!user) return

    // Limpar notificações expiradas ao carregar
    cleanExpiredNotifications()

    // Escutar notificações ativas
    const unsubscribe = getActiveUserNotifications(user.uid, (activeNotifications) => {
      setNotifications(activeNotifications)
      const unread = activeNotifications.filter((n) => !n.read).length
      setUnreadCount(unread)
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user || (userLevel !== "Premium" && userLevel !== "Diamante")) return

    const checkNewMessages = () => {
      const lastReadTime = localStorage.getItem(`lastChatRead_${user.uid}`)
      const hasNewMessages = localStorage.getItem(`hasNewChatMessages_${user.uid}`)

      if (hasNewMessages === "true") {
        setHasNewChatMessages(true)
      }
    }

    checkNewMessages()

    // Verificar a cada 30 segundos
    const interval = setInterval(checkNewMessages, 30000)
    return () => clearInterval(interval)
  }, [user, userLevel])

  const isabelleAvatar = isabelleProfile?.profileImage || "/beautiful-woman-profile.png"

  const handleNotificationsClick = () => {
    setShowNotifications(true)
    setShowSearch(false)
  }

  const handleSearchClick = () => {
    setShowSearch(true)
    setShowNotifications(false)
  }

  const closeModals = () => {
    setShowSearch(false)
    setShowNotifications(false)
  }

  const handleChatClick = () => {
    if (user) {
      setHasNewChatMessages(false)
      localStorage.removeItem(`hasNewChatMessages_${user.uid}`)
      localStorage.setItem(`lastChatRead_${user.uid}`, Date.now().toString())
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Agora"

    const now = new Date()
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const isActive = (path: string) => {
    if (path === "/feed") return pathname === "/feed" || pathname === "/"
    if (path === "/profile") return pathname.startsWith("/profile") || pathname.startsWith("/user")
    if (path === "/chat") return pathname.startsWith("/chat")
    return pathname === path
  }

  const canAccessChat = userLevel === "Premium" || userLevel === "Diamante"

  return (
    <>
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16 sm:pt-20 px-4">
          <Card className="w-full max-w-md animate-in slide-in-from-top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Buscar</CardTitle>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={closeModals}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">Perfis recomendados:</div>

              <Link href="/profile/isabellelua" onClick={closeModals}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={isabelleAvatar || "/placeholder.svg"} alt="Isabelle Lua" />
                    <AvatarFallback>IL</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <h3 className="font-semibold">Isabelle Lua</h3>
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">@isabellelua</p>
                    <p className="text-xs text-muted-foreground">Modelo & Influenciadora Digital</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                    Ver perfil
                  </Button>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16 sm:pt-20 px-4">
          <Card className="w-full max-w-md animate-in slide-in-from-top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Notificações</CardTitle>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={closeModals}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        !notification.read ? "bg-muted/30 border-primary/20" : "hover:bg-muted/50 border-border"
                      }`}
                      onClick={() => {
                        if (!notification.read && notification.id) {
                          handleMarkAsRead(notification.id)
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={notification.fromProfileImage || isabelleAvatar}
                              alt={notification.fromDisplayName || "Isabelle"}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {notification.fromDisplayName?.[0] || "I"}
                            </AvatarFallback>
                          </Avatar>
                          {!notification.read && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-foreground leading-tight">{notification.title}</p>
                            <span className="text-xs text-muted-foreground font-medium ml-2 flex-shrink-0">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{notification.message}</p>
                          {notification.fromDisplayName && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-primary font-medium">{notification.fromDisplayName}</span>
                              <div className="w-1 h-1 bg-primary/60 rounded-full"></div>
                              <span className="text-xs text-muted-foreground">Mensagem especial</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border z-40">
        <div className="flex items-center justify-around p-2 sm:p-4 max-w-md mx-auto">
          <Link href="/feed">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full ${isActive("/feed") ? "text-primary" : "text-muted-foreground"}`}
            >
              <div className="flex flex-col items-center space-y-1">
                <Home className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs">Feed</span>
              </div>
            </Button>
          </Link>

          {canAccessChat ? (
            <Link href="/chat/isabellelua" onClick={handleChatClick}>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full relative ${isActive("/chat") ? "text-primary" : "text-muted-foreground"}`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs">Chat</span>
                  {hasNewChatMessages && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">!</span>
                    </div>
                  )}
                </div>
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground opacity-50" disabled>
              <div className="flex flex-col items-center space-y-1">
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs">Chat</span>
              </div>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground relative"
            onClick={handleNotificationsClick}
          >
            <div className="flex flex-col items-center space-y-1">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs">Notificações</span>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </div>
              )}
            </div>
          </Button>

          {userProfile ? (
            <Link href={`/user/${encodeURIComponent(userProfile.username)}`}>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-xs">Perfil</span>
                </div>
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">
              <div className="flex flex-col items-center space-y-1">
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs">Perfil</span>
              </div>
            </Button>
          )}
        </div>
      </nav>
    </>
  )
}
