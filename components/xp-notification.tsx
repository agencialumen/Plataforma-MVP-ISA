"use client"

import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp } from "lucide-react"

interface XPNotificationProps {
  show: boolean
  xpGained: number
  action: string
  onClose: () => void
}

export function XPNotification({ show, xpGained, action, onClose }: XPNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Auto close after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const getActionText = (action: string) => {
    switch (action) {
      case "like":
        return "Curtida"
      case "comment":
        return "Comentário"
      case "retweet":
        return "Retweet"
      default:
        return "Ação"
    }
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
      <Card className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30 backdrop-blur-sm shadow-lg">
        <div className="p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-full">
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-yellow-400">+{xpGained} XP</span>
              <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                {getActionText(action)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Experiência ganha!</p>
          </div>
          <TrendingUp className="w-4 h-4 text-yellow-400" />
        </div>
      </Card>
    </div>
  )
}
