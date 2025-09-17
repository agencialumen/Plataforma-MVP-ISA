"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ImageIcon, VideoIcon, Type, Loader2, Heart, MessageCircle, RefreshCw, Lock } from "lucide-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import { createPost, getIsabelleProfile } from "@/lib/firebase/firestore"
import { useToast } from "@/components/toast-provider"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
}

type PostType = "text" | "image" | "video"
type UserLevel = "Gold" | "Premium" | "Diamante"

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [user] = useAuthState(auth)
  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [postType, setPostType] = useState<PostType>("text")
  const [initialLikes, setInitialLikes] = useState(0)
  const [initialComments, setInitialComments] = useState(0)
  const [initialRetweets, setInitialRetweets] = useState(0)
  const [requiredLevel, setRequiredLevel] = useState<UserLevel>("Gold")
  const [loading, setLoading] = useState(false)
  const [isabelleProfile, setIsabelleProfile] = useState({
    displayName: "Isabelle Lua",
    profileImage: "/beautiful-woman-profile.png",
  })

  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (isOpen) {
      const fetchIsabelleProfile = async () => {
        try {
          console.log("[v0] Fetching Isabelle profile for modal...")
          const profile = await getIsabelleProfile()
          console.log("[v0] Isabelle profile fetched:", profile)
          setIsabelleProfile({
            displayName: profile.displayName || "Isabelle Lua",
            profileImage: profile.profileImage || "/beautiful-woman-profile.png",
          })
        } catch (error) {
          console.error("[v0] Error fetching Isabelle profile:", error)
        }
      }
      fetchIsabelleProfile()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    console.log("[v0] handleSubmit called", {
      content: content.trim(),
      postType,
      mediaUrl,
      requiredLevel,
      contentLength: content.length,
    })

    if (!content.trim()) {
      console.log("[v0] Validation failed - no content")
      showError("Erro de validação", "Por favor, escreva algum conteúdo para o post.")
      return
    }

    if (content.length > 280) {
      console.log("[v0] Validation failed - content too long")
      showError("Erro de validação", "O conteúdo não pode ter mais de 280 caracteres.")
      return
    }

    console.log("[v0] Starting post creation...")
    setLoading(true)
    try {
      const postData = {
        authorId: "isabelle-lua-admin",
        authorUsername: "isabellelua",
        authorDisplayName: isabelleProfile.displayName,
        authorProfileImage: isabelleProfile.profileImage,
        content: content.trim(),
        images: postType === "image" && mediaUrl ? [mediaUrl] : [],
        videos: postType === "video" && mediaUrl ? [mediaUrl] : [],
        likes: Math.max(0, initialLikes),
        comments: Math.max(0, initialComments),
        retweets: Math.max(0, initialRetweets),
        requiredLevel,
      }

      console.log("[v0] Post data prepared:", postData)
      await createPost(postData)
      console.log("[v0] Post created successfully")

      showSuccess("Post criado!", "Seu post foi publicado com sucesso no feed.")

      setContent("")
      setMediaUrl("")
      setPostType("text")
      setInitialLikes(0)
      setInitialComments(0)
      setInitialRetweets(0)
      setRequiredLevel("Gold")
      onClose()
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      showError("Erro ao criar post", "Não foi possível publicar o post. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholderText = () => {
    switch (postType) {
      case "text":
        return "Escreva uma mensagem inspiradora..."
      case "image":
        return "Descreva sua foto..."
      case "video":
        return "Conte sobre seu vídeo..."
      default:
        return "O que está acontecendo?"
    }
  }

  const getMediaPlaceholder = () => {
    switch (postType) {
      case "image":
        return "https://exemplo.com/imagem.jpg"
      case "video":
        return "https://exemplo.com/video.mp4"
      default:
        return ""
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Criar Novo Post</h2>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={isabelleProfile.profileImage || "/placeholder.svg"} alt="Isabelle Lua" />
              <AvatarFallback>IL</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{isabelleProfile.displayName}</h3>
              <p className="text-muted-foreground text-xs">@isabellelua</p>
            </div>
          </div>

          {/* Access Level Selector */}
          <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Nível de Acesso Requerido
            </label>
            <Select value={requiredLevel} onValueChange={(value: UserLevel) => setRequiredLevel(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gold">
                  <div className="flex items-center space-x-2">
                    <span>🥇 Gold</span>
                    <span className="text-xs text-muted-foreground">(Gratuito)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Premium">
                  <div className="flex items-center space-x-2">
                    <span>👑 Premium</span>
                    <span className="text-xs text-muted-foreground">(R$ 79,90/mês)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Diamante">
                  <div className="flex items-center space-x-2">
                    <span>💎 Diamante</span>
                    <span className="text-xs text-muted-foreground">(R$ 149,90/mês)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {requiredLevel !== "Gold" && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Este conteúdo será visível apenas para assinantes {requiredLevel} ou superior
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              variant={postType === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPostType("text")
                setMediaUrl("")
              }}
              className="flex items-center space-x-2"
            >
              <Type className="h-4 w-4" />
              <span>Texto</span>
            </Button>
            <Button
              variant={postType === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setPostType("image")}
              className="flex items-center space-x-2"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Foto</span>
            </Button>
            <Button
              variant={postType === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setPostType("video")}
              className="flex items-center space-x-2"
            >
              <VideoIcon className="h-4 w-4" />
              <span>Vídeo</span>
            </Button>
          </div>

          {/* Post Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholderText()}
            className="bg-transparent resize-none border-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
            rows={postType === "text" ? 6 : 3}
          />

          {postType !== "text" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center">
                {postType === "image" ? (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    URL da Imagem
                  </>
                ) : (
                  <>
                    <VideoIcon className="h-4 w-4 mr-2" />
                    URL do Vídeo
                  </>
                )}
              </label>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={getMediaPlaceholder()}
                className="bg-transparent"
              />
            </div>
          )}

          {mediaUrl && postType === "image" && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={mediaUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-48 object-cover"
                onError={() => setMediaUrl("")}
              />
            </div>
          )}

          {mediaUrl && postType === "video" && (
            <div className="rounded-lg overflow-hidden border border-border">
              <video src={mediaUrl} className="w-full h-48 object-cover" controls onError={() => setMediaUrl("")}>
                Seu navegador não suporta vídeos.
              </video>
            </div>
          )}

          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground">Contadores Iniciais (Opcional)</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center">
                  <Heart className="h-3 w-3 text-red-500 mr-1" />
                  Curtidas
                </label>
                <Input
                  type="number"
                  value={initialLikes}
                  onChange={(e) => setInitialLikes(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="text-center h-8"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center">
                  <MessageCircle className="h-3 w-3 text-blue-500 mr-1" />
                  Comentários
                </label>
                <Input
                  type="number"
                  value={initialComments}
                  onChange={(e) => setInitialComments(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="text-center h-8"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center">
                  <RefreshCw className="h-3 w-3 text-green-500 mr-1" />
                  Retweets
                </label>
                <Input
                  type="number"
                  value={initialRetweets}
                  onChange={(e) => setInitialRetweets(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="text-center h-8"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center space-x-2">
              <span>{content.length}/280</span>
              {postType !== "text" && (
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {postType === "image" ? "📸 Foto" : "🎥 Vídeo"}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.log("[v0] Publish button clicked", {
                content: content.trim(),
                requiredLevel,
                disabled: !content.trim() || content.length > 280 || loading,
              })
              handleSubmit()
            }}
            disabled={!content.trim() || content.length > 280 || loading}
            className="rounded-full glow-pink-hover"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
