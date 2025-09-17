"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getIsabelleProfile } from "@/lib/firebase/firestore"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"

interface TopNavigationProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
  userProfile?: any
}

export function TopNavigation({
  title = "DeLuxe Isa",
  showBackButton = false,
  backHref = "/feed",
  userProfile,
}: TopNavigationProps) {
  const [user] = useAuthState(auth)
  const [showSearch, setShowSearch] = useState(false)
  const [isabelleProfile, setIsabelleProfile] = useState<any>(null)
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

  const isabelleAvatar = isabelleProfile?.profileImage || "/beautiful-woman-profile.png"

  const handleSearchClick = () => {
    setShowSearch(true)
  }

  const closeModals = () => {
    setShowSearch(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-3 sm:p-4 max-w-md mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="ghost" size="sm" className="rounded-full p-2">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            )}
            <h1 className="text-lg sm:text-2xl font-bold text-primary truncate">{title}</h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-3">
            <Button variant="ghost" size="sm" className="rounded-full p-2" onClick={handleSearchClick}>
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </header>

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
    </>
  )
}
