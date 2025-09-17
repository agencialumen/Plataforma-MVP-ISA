"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, ImageIcon, Loader2, Heart, MessageCircle, RefreshCw, Plus, Minus } from "lucide-react"
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Post } from "@/lib/firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock } from "lucide-react"

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post | null
}

export function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState(0)
  const [retweets, setRetweets] = useState(0)
  const [requiredLevel, setRequiredLevel] = useState<"Gold" | "Premium" | "Diamante">("Gold") // Estado para nível requerido
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (post) {
      setContent(post.content)
      setImageUrl(post.images?.[0] || "")
      setLikes(post.likes || 0)
      setComments(post.comments || 0)
      setRetweets(post.retweets || 0)
      setRequiredLevel(post.requiredLevel || "Gold") // Carregando nível do post
    }
  }, [post])

  const handleSubmit = async () => {
    if (!post?.id || !content.trim()) return

    setLoading(true)
    try {
      await updateDoc(doc(db, "posts", post.id), {
        content: content.trim(),
        images: imageUrl ? [imageUrl] : [],
        likes: Math.max(0, likes),
        comments: Math.max(0, comments),
        retweets: Math.max(0, retweets),
        requiredLevel, // Salvando nível requerido
        updatedAt: new Date(),
      })

      onClose()
      alert("Post atualizado com sucesso!")
    } catch (error) {
      console.error("[v0] Error updating post:", error)
      alert("Erro ao atualizar post. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const adjustCounter = (type: "likes" | "comments" | "retweets", increment: boolean) => {
    const adjustment = increment ? 1 : -1

    switch (type) {
      case "likes":
        setLikes((prev) => Math.max(0, prev + adjustment))
        break
      case "comments":
        setComments((prev) => Math.max(0, prev + adjustment))
        break
      case "retweets":
        setRetweets((prev) => Math.max(0, prev + adjustment))
        break
    }
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

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Editar Post</h2>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorProfileImage || "/placeholder.svg"} alt={post.authorDisplayName} />
              <AvatarFallback>IL</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{post.authorDisplayName}</h3>
              <p className="text-muted-foreground text-xs">@{post.authorUsername}</p>
            </div>
          </div>

          {/* Post Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está acontecendo?"
            className="bg-transparent resize-none border-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
            rows={4}
          />

          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              URL da Imagem (opcional)
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="bg-transparent"
            />
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-48 object-cover"
                onError={() => setImageUrl("")}
              />
            </div>
          )}

          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground">Contadores de Interação</h3>

            {/* Curtidas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Curtidas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => adjustCounter("likes", false)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={likes}
                  onChange={(e) => setLikes(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="w-20 text-center h-8"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => adjustCounter("likes", true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[40px]">{formatNumber(likes)}</span>
              </div>
            </div>

            {/* Comentários */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Comentários</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => adjustCounter("comments", false)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={comments}
                  onChange={(e) => setComments(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="w-20 text-center h-8"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => adjustCounter("comments", true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[40px]">{formatNumber(comments)}</span>
              </div>
            </div>

            {/* Retweets */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Retweets</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => adjustCounter("retweets", false)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={retweets}
                  onChange={(e) => setRetweets(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="w-20 text-center h-8"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => adjustCounter("retweets", true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[40px]">{formatNumber(retweets)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Nível de Acesso Requerido
            </label>
            <Select
              value={requiredLevel}
              onValueChange={(value: "Gold" | "Premium" | "Diamante") => setRequiredLevel(value)}
            >
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gold">🥇 Gold (Gratuito)</SelectItem>
                <SelectItem value="Premium">👑 Premium (R$ 79,90/mês)</SelectItem>
                <SelectItem value="Diamante">💎 Diamante (R$ 149,90/mês)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{content.length}/280</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || content.length > 280 || loading}
            className="rounded-full glow-pink-hover"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
