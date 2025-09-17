"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createUser, signInUser } from "@/lib/firebase/auth"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    isOver18: false,
    acceptTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [keySequence, setKeySequence] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!event.key) return

      const newSequence = (keySequence + event.key.toUpperCase()).slice(-10) // Mantém apenas os últimos 10 caracteres
      setKeySequence(newSequence)

      if (newSequence.includes("LOGINADMIN")) {
        console.log("[v0] Secret key sequence detected, redirecting to admin...")
        router.push("/admin")
        setKeySequence("") // Reset da sequência
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [keySequence, router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username) {
      newErrors.username = "Nome de usuário é obrigatório"
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres"
    }

    if (!isLogin) {
      if (!formData.isOver18) {
        newErrors.isOver18 = "Você deve ter mais de 18 anos"
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = "Você deve aceitar os termos de uso"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      if (isLogin) {
        const { user, error } = await signInUser(formData.username, formData.password)

        if (error) {
          setErrors({ general: error })
          return
        }

        if (user) {
          router.push("/feed")
        }
      } else {
        const { user, error } = await createUser(formData.username, formData.password)

        if (error) {
          if (error.includes("já está em uso")) {
            setErrors({ username: error })
          } else {
            setErrors({ general: error })
          }
          return
        }

        if (user) {
          router.push("/feed")
        }
      }
    } catch (error) {
      console.error("Auth error:", error)
      setErrors({ general: "Erro interno. Tente novamente." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">DeLuxe Isa</h1>
          <p className="text-muted-foreground">Plataforma premium de conteúdo exclusivo</p>
        </div>

        <Card className="glow-pink border-border/50 fade-in">
          <CardHeader className="space-y-1">
            <div className="flex space-x-1">
              <Button
                variant={isLogin ? "default" : "ghost"}
                className={`flex-1 rounded-full ${isLogin ? "glow-pink" : ""}`}
                onClick={() => setIsLogin(true)}
              >
                Entrar
              </Button>
              <Button
                variant={!isLogin ? "default" : "ghost"}
                className={`flex-1 rounded-full ${!isLogin ? "glow-pink" : ""}`}
                onClick={() => setIsLogin(false)}
              >
                Criar conta
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{errors.general}</p>
                </div>
              )}

              <div className="space-y-2 fade-in">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Seu nome de usuário"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="rounded-full border-border focus:ring-primary focus:border-primary glow-pink-hover"
                />
                {errors.username && <p className="text-destructive text-sm">{errors.username}</p>}
              </div>

              <div className="space-y-2 fade-in">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="rounded-full border-border focus:ring-primary focus:border-primary glow-pink-hover pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>

              {!isLogin && (
                <div className="space-y-3 fade-in">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="over18"
                      checked={formData.isOver18}
                      onCheckedChange={(checked) => handleInputChange("isOver18", checked as boolean)}
                    />
                    <Label htmlFor="over18" className="text-sm">
                      Tenho mais de 18 anos
                    </Label>
                  </div>
                  {errors.isOver18 && <p className="text-destructive text-sm">{errors.isOver18}</p>}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Aceito os termos de uso
                    </Label>
                  </div>
                  {errors.acceptTerms && <p className="text-destructive text-sm">{errors.acceptTerms}</p>}
                </div>
              )}

              <Button type="submit" className="w-full rounded-full glow-pink-hover" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Entrando..." : "Criando conta..."}
                  </>
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </Button>

              {isLogin && (
                <div className="text-center fade-in">
                  <Button variant="link" className="text-primary hover:text-primary/80">
                    Esqueci minha senha
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
