"use client"

import { Button } from "@/components/ui/button"
import { Crown, Lock, Diamond } from "lucide-react"
import Link from "next/link"

interface PremiumContentOverlayProps {
  requiredLevel: "Gold" | "Platinum" | "Diamante"
  userLevel: "Gold" | "Platinum" | "Diamante"
}

const levelOrder = {
  Gold: 1, // Nível gratuito
  Platinum: 2, // Nível pago
  Diamante: 3, // Nível premium
}

const levelIcons = {
  Gold: "🥇",
  Platinum: <Crown className="w-4 h-4 text-purple-400" />,
  Diamante: <Diamond className="w-4 h-4 text-blue-400" />,
}

export function PremiumContentOverlay({ requiredLevel, userLevel }: PremiumContentOverlayProps) {
  const hasAccess = levelOrder[userLevel] >= levelOrder[requiredLevel]

  if (hasAccess) {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
      <div className="p-4 max-w-xs mx-4 text-center bg-black/80 backdrop-blur border border-gray-800 rounded-lg glow-pink">
        <div className="flex justify-center mb-3">
          <div className="p-2 rounded-full bg-gray-900 border border-gray-700">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <h3 className="text-sm font-semibold mb-2 text-white">Conteúdo {requiredLevel}</h3>
        <p className="text-xs text-gray-400 mb-3">Exclusivo para {requiredLevel}</p>

        <Link href="/checkout">
          <Button size="sm" className="w-full bg-primary hover:bg-primary/80 glow-pink-hover text-xs">
            Fazer Upgrade
          </Button>
        </Link>
      </div>
    </div>
  )
}
