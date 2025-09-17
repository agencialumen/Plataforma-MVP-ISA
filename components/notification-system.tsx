"use client"

import { useState, useEffect } from "react"
import { Bell, X, Heart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getActiveUserNotifications,
  markNotificationAsRead,
  cleanExpiredNotifications,
  type Notification,
} from "@/lib/firebase/firestore"
import { useAuth } from "@/lib/firebase/auth"

export function NotificationSystem() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <Heart className="h-5 w-5 text-pink-500" />
      case "welcome":
        return <Sparkles className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <Button
        variant="ghost"
        size="sm"
        className={`relative p-2 transition-all duration-200 ${
          unreadCount > 0 ? "text-pink-600 hover:text-pink-700" : "hover:text-gray-700"
        }`}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? "animate-pulse" : ""}`} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-pink-500 hover:bg-pink-600 animate-pulse"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Painel de notificações */}
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-hidden z-50 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-pink-600" />
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs">
                    {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
                className="hover:bg-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma notificação no momento</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 cursor-pointer transition-all duration-200 ${
                        !notification.read
                          ? "bg-gradient-to-r from-pink-50/50 to-purple-50/50 border-l-4 border-pink-400"
                          : ""
                      }`}
                      onClick={() => {
                        if (!notification.read && notification.id) {
                          handleMarkAsRead(notification.id)
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        {notification.fromProfileImage ? (
                          <div className="relative">
                            <Avatar className="h-10 w-10 ring-2 ring-pink-200 shadow-sm">
                              <AvatarImage
                                src={notification.fromProfileImage || "/placeholder.svg"}
                                alt={notification.fromDisplayName || "Perfil"}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-pink-100 text-pink-600 font-semibold">
                                {notification.fromDisplayName?.[0] || "I"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-sm">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{notification.title}</p>
                            <span className="text-xs text-gray-500 font-medium ml-2 flex-shrink-0">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{notification.message}</p>
                          {!notification.read && (
                            <div className="flex items-center mt-2">
                              <div className="h-2 w-2 bg-pink-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-pink-600 font-medium ml-2">Nova</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
