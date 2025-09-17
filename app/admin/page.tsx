"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  RefreshCw,
  ArrowLeft,
  User,
  Save,
  Sparkles,
  Users,
  Crown,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Send,
} from "lucide-react"
import Link from "next/link"
import {
  getPosts,
  deletePost,
  updateUserProfile,
  getIsabelleProfile,
  saveIsabelleProfile,
  createStory,
  updateStory,
  deleteStory,
  getIsabelleStories,
  createNotificationTemplate,
  getNotificationTemplates,
  deleteNotificationTemplate,
  sendBulkNotifications,
  forceDeleteIsabelleNotifications, // Nova função
} from "@/lib/firebase/firestore"
import { CreatePostModal } from "@/components/admin/create-post-modal"
import { EditPostModal } from "@/components/admin/edit-post-modal"
import { useToast } from "@/components/toast-provider"
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"

interface Post {
  id?: string
  authorDisplayName: string
  authorProfileImage: string
  content: string
  images: string[]
  likes: number
  comments: number
  retweets: number
  createdAt: any
  updatedAt: any
}

interface Story {
  id?: string
  name: string
  coverImage: string
  requiredLevel: "Bronze" | "Prata" | "Gold" | "Diamante"
  images: string[]
  createdAt?: any
  updatedAt?: any
}

interface UserProfile {
  uid: string
  username: string
  displayName: string
  profileImage: string
  level: "Bronze" | "Prata" | "Gold" | "Diamante"
  followers: number
  following: number
  createdAt: any
}

interface NotificationTemplate {
  id?: string
  title: string
  message: string
  type: "welcome" | "promotion" | "announcement" | "custom"
  targetLevel: "all" | "Bronze" | "Prata" | "Gold" | "Diamante"
  scheduledFor: string
  isActive: boolean
  createdBy: string
  createdAt?: any
}

interface IsabelleProfile {
  displayName: string
  bio: string
  profileImage: string
  followers: number
  following: number
  socialLinks: {
    youtube: string
    tiktok: string
    instagram: string
    twitter: string
  }
  shortCover: string
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userLevel: string
  message: string
  timestamp: Date
  read: boolean
  adminReply?: string | null
}

export default function AdminPanel() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const { showSuccess, showError, confirm } = useToast()

  const [isabelleProfile, setIsIsabelleProfile] = useState<IsabelleProfile>({
    displayName: "Isabelle Lua",
    bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium\n📧 Contato: isabelle@deluxeisa.com",
    profileImage: "/beautiful-woman-profile.png",
    followers: 2400000,
    following: 1250,
    socialLinks: {
      youtube: "",
      tiktok: "",
      instagram: "",
      twitter: "",
    },
    shortCover: "",
  })
  const [profileLoading, setProfileLoading] = useState(false)

  const [stories, setStories] = useState<Story[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [newStory, setNewStory] = useState<Omit<Story, "id" | "createdAt" | "updatedAt">>({
    name: "",
    coverImage: "",
    requiredLevel: "Gold",
    images: [""],
  })

  const [users, setUsers] = useState<UserProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<"all" | "Bronze" | "Prata" | "Gold" | "Diamante">("all")

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [menuExpanded, setMenuExpanded] = useState({
    content: true,
    users: false,
    communication: false,
    analytics: false,
  })

  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null)
  const [adminReply, setAdminReply] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const [activeTab, setActiveTab] = useState<
    "overview" | "posts" | "stories" | "profile" | "users" | "chat" | "notifications"
  >("overview")

  const [autoMessage, setAutoMessage] = useState("")
  const [autoMessageImage, setAutoMessageImage] = useState("")
  const [savingAutoMessage, setSavingAutoMessage] = useState(false)

  const [notificationTemplate, setNotificationTemplate] = useState({
    title: "",
    message: "",
    type: "welcome" as "welcome" | "promotion" | "announcement" | "custom",
    targetLevel: "all" as "all" | "Bronze" | "Prata" | "Gold" | "Diamante",
    scheduledFor: "",
    isActive: true,
  })

  const [notificationTemplates, setNotificationTemplates] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)

  const [cleaningNotifications, setCleaningNotifications] = useState(false)

  const loadPosts = () => {
    console.log("[v0] Admin panel loading posts...")
    const unsubscribe = getPosts((fetchedPosts) => {
      setPosts(fetchedPosts)
      setLoading(false)
    })
    return unsubscribe
  }

  const loadStories = async () => {
    try {
      const storiesData = await getIsabelleStories()
      setStories(storiesData)
    } catch (error) {
      console.error("[v0] Error loading stories:", error)
    }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, orderBy("createdAt", "desc"), limit(100))
      const querySnapshot = await getDocs(q)

      const usersData: UserProfile[] = []
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as UserProfile
        // Filtrar o usuário da Isabelle para não aparecer na lista
        if (userData.uid !== "isabelle-lua-uid") {
          usersData.push({
            ...userData,
            uid: doc.id,
          })
        }
      })

      setUsers(usersData)
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      showError("Erro ao carregar", "Não foi possível carregar a lista de usuários")
    } finally {
      setUsersLoading(false)
    }
  }

  const loadChatMessages = async () => {
    setChatLoading(true)
    try {
      console.log("[v0] Loading real chat messages from Firebase")

      const messagesRef = collection(db, "chatMessages")
      const q = query(messagesRef, orderBy("timestamp", "desc"))

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: ChatMessage[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          messages.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userLevel: data.userLevel,
            message: data.message,
            timestamp: data.timestamp?.toDate() || new Date(),
            read: data.read || false,
            adminReply: data.adminReply || null,
          })
        })

        setChatMessages(messages)
        setUnreadCount(messages.filter((msg) => !msg.read).length)
        console.log("[v0] Loaded", messages.length, "real messages from Firebase")
      })

      return unsubscribe
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
      setChatMessages([])
      setUnreadCount(0)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSaveAutoMessage = async () => {
    if (!autoMessage.trim()) {
      showError("Digite uma mensagem para salvar")
      return
    }

    setSavingAutoMessage(true)
    try {
      const configRef = doc(db, "config", "autoWelcomeMessage")
      await setDoc(configRef, {
        message: autoMessage,
        image: autoMessageImage,
        updatedAt: serverTimestamp(),
      })

      showSuccess("Mensagem automática salva com sucesso!")
      console.log("[v0] Auto welcome message saved to Firebase")
    } catch (error) {
      console.error("Error saving auto message:", error)
      showError("Erro ao salvar mensagem automática")
    } finally {
      setSavingAutoMessage(false)
    }
  }

  const loadAutoMessage = async () => {
    try {
      const configRef = doc(db, "config", "autoWelcomeMessage")
      const configSnap = await getDoc(configRef)

      if (configSnap.exists()) {
        const data = configSnap.data()
        setAutoMessage(data.message || "")
        setAutoMessageImage(data.image || "")
      }
    } catch (error) {
      console.error("Error loading auto message:", error)
    }
  }

  const handleSendAdminReply = async (messageId: string) => {
    if (!adminReply.trim()) return

    setSendingReply(true)
    try {
      console.log("[v0] Sending admin reply to Firebase:", adminReply)

      const messageRef = doc(db, "chatMessages", messageId)
      await updateDoc(messageRef, {
        adminReply: adminReply,
        adminReplyTimestamp: serverTimestamp(),
        read: true,
        userNotified: false, // Para notificar o usuário sobre a nova resposta
      })

      const message = chatMessages.find((msg) => msg.id === messageId)
      if (message) {
        // Salvar notificação no localStorage do usuário
        const notificationKey = `hasNewChatMessages_${message.userId}`
        localStorage.setItem(notificationKey, "true")

        // Tentar enviar notificação push se o navegador suportar
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Isabelle te respondeu! 💕", {
            body: `Nova resposta: ${adminReply.substring(0, 50)}${adminReply.length > 50 ? "..." : ""}`,
            icon: "/beautiful-woman-profile.png",
            tag: `chat-reply-${messageId}`,
            requireInteraction: true,
          })
        }

        showSuccess("Resposta enviada! O usuário será notificado.")
      }

      setAdminReply("")
      setSelectedChatUser(null)

      console.log("[v0] Admin reply sent successfully to Firebase")
    } catch (error) {
      console.error("Error sending admin reply:", error)
      showError("Erro ao enviar resposta")
    } finally {
      setSendingReply(false)
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, "chatMessages", messageId)
      await updateDoc(messageRef, { read: true })
      console.log("[v0] Message marked as read in Firebase:", messageId)
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const loadNotificationTemplates = async () => {
    setNotificationsLoading(true)
    try {
      const templates = await getNotificationTemplates()
      setNotificationTemplates(templates)
    } catch (error) {
      console.error("Erro ao carregar templates:", error)
      showError("Erro ao carregar", "Não foi possível carregar os templates")
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleCreateNotificationTemplate = async () => {
    if (!notificationTemplate.title.trim() || !notificationTemplate.message.trim()) {
      showError("Campos obrigatórios", "Título e mensagem são obrigatórios")
      return
    }

    setNotificationsLoading(true)
    try {
      await createNotificationTemplate({
        ...notificationTemplate,
        createdBy: "admin",
      })

      setNotificationTemplate({
        title: "",
        message: "",
        type: "welcome",
        targetLevel: "all",
        scheduledFor: "",
        isActive: true,
      })

      await loadNotificationTemplates()
      showSuccess("Template criado!", "Template de notificação criado com sucesso")
    } catch (error) {
      console.error("Erro ao criar template:", error)
      showError("Erro ao criar", "Não foi possível criar o template")
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleSendNotification = async (template: NotificationTemplate) => {
    const confirmed = await confirm(
      "Enviar Notificação",
      `Tem certeza que deseja enviar esta notificação para ${template.targetLevel === "all" ? "todos os usuários" : `usuários ${template.targetLevel}`}?`,
    )

    if (!confirmed) return

    setSendingNotification(true)
    try {
      const sentCount = await sendBulkNotifications(template)

      showSuccess("Notificação enviada!", `Notificação enviada para ${sentCount} usuários com sucesso`)
    } catch (error) {
      console.error("Erro ao enviar notificação:", error)
      showError("Erro ao enviar", "Não foi possível enviar a notificação")
    } finally {
      setSendingNotification(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmed = await confirm(
      "Deletar Template",
      "Tem certeza que deseja deletar este template? Esta ação não pode ser desfeita.",
    )

    if (!confirmed) return

    try {
      await deleteNotificationTemplate(templateId)
      await loadNotificationTemplates()
      showSuccess("Template deletado!", "Template removido com sucesso")
    } catch (error) {
      console.error("Erro ao deletar template:", error)
      showError("Erro ao deletar", "Não foi possível deletar o template")
    }
  }

  const handleCleanIsabelleNotifications = async () => {
    const confirmed = await confirm(
      "Limpar Notificações",
      "Tem certeza que deseja remover TODAS as notificações da Isabelle de todos os usuários? Esta ação não pode ser desfeita e irá buscar por todas as notificações que contenham 'Isabelle' em qualquer campo.",
    )

    if (!confirmed) return

    setCleaningNotifications(true)
    try {
      const result = await forceDeleteIsabelleNotifications()

      if (result.success) {
        showSuccess("Notificações limpas!", result.message)
      } else {
        showError("Erro na limpeza", result.message)
      }
    } catch (error) {
      console.error("Erro ao limpar notificações:", error)
      showError("Erro ao limpar", "Não foi possível limpar as notificações antigas")
    } finally {
      setCleaningNotifications(false)
    }
  }

  useEffect(() => {
    loadNotificationTemplates()
  }, [])

  useEffect(() => {
    console.log("[v0] Admin panel loading posts...")
    const unsubscribe = loadPosts()

    const loadIsabelleProfile = async () => {
      try {
        const profile = await getIsabelleProfile()
        setIsIsabelleProfile({
          displayName: profile.displayName || "Isabelle Lua",
          bio:
            profile.bio ||
            "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
          profileImage: profile.profileImage || "/beautiful-woman-profile.png",
          followers: profile.followers || 2400000,
          following: profile.following || 1250,
          socialLinks: profile.socialLinks || { youtube: "", tiktok: "", instagram: "", twitter: "" },
          shortCover: profile.shortCover || "",
        })
      } catch (error) {
        console.error("[v0] Error loading Isabelle profile:", error)
      }
    }

    loadIsabelleProfile()
    loadStories()

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    loadPosts()
    loadUsers()
    loadChatMessages()
    loadAutoMessage() // Carregando mensagem automática ao inicializar
  }, [])

  const handleChangeUserLevel = async (userId: string, newLevel: "Bronze" | "Prata" | "Gold" | "Diamante") => {
    const user = users.find((u) => u.uid === userId)
    if (!user) return

    const confirmed = await confirm(
      "Alterar Nível do Usuário",
      `Tem certeza que deseja alterar o nível de ${user.displayName || user.username} para ${newLevel}?`,
    )

    if (!confirmed) return

    try {
      await updateUserProfile(userId, { level: newLevel })

      // Atualizar a lista local
      setUsers((prevUsers) => prevUsers.map((u) => (u.uid === userId ? { ...u, level: newLevel } : u)))

      showSuccess("Nível alterado!", `${user.displayName || user.username} agora é ${newLevel}`)
    } catch (error) {
      console.error("[v0] Error updating user level:", error)
      showError("Erro ao alterar", "Não foi possível alterar o nível do usuário")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLevel = selectedLevel === "all" || user.level === selectedLevel

    return matchesSearch && matchesLevel
  })

  const handleEditPost = (post: Post) => {
    setSelectedPost(post)
    setEditModalOpen(true)
  }

  const handleDeletePost = async (postId: string) => {
    const confirmed = await confirm(
      "Deletar Post",
      "Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.",
    )

    if (!confirmed) return

    try {
      console.log("[v0] Deleting post:", postId)
      await deletePost(postId)
      console.log("[v0] Post deleted successfully")

      showSuccess("Post deletado!", "O post foi removido com sucesso")
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
      showError("Erro ao deletar", "Não foi possível deletar o post. Tente novamente.")
    }
  }

  const handleSaveProfile = async () => {
    setProfileLoading(true)
    try {
      console.log("[v0] Saving Isabelle profile:", isabelleProfile)
      await saveIsabelleProfile(isabelleProfile)

      showSuccess("Perfil atualizado!", "As informações da Isabelle foram salvas com sucesso")
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      showError("Erro ao salvar", "Não foi possível salvar o perfil. Tente novamente.")
    } finally {
      setProfileLoading(false)
    }
  }

  const handleCreateStory = async () => {
    if (!newStory.name || !newStory.coverImage) {
      showError("Campos obrigatórios", "Nome e imagem de capa são obrigatórios")
      return
    }

    setStoriesLoading(true)
    try {
      await createStory(newStory)
      const updatedStories = await getIsabelleStories()
      setStories(updatedStories)
      setNewStory({
        name: "",
        coverImage: "",
        requiredLevel: "Gold",
        images: [""],
      })
      showSuccess("Story criado!", "O destaque foi criado com sucesso")
    } catch (error) {
      console.error("[v0] Error creating story:", error)
      showError("Erro ao criar", "Não foi possível criar o story. Tente novamente.")
    } finally {
      setStoriesLoading(false)
    }
  }

  const handleUpdateStory = async () => {
    if (!editingStory) return

    setStoriesLoading(true)
    try {
      await updateStory(editingStory.id!, {
        name: editingStory.name,
        coverImage: editingStory.coverImage,
        requiredLevel: editingStory.requiredLevel,
        images: editingStory.images,
      })
      const updatedStories = await getIsabelleStories()
      setStories(updatedStories)
      setEditingStory(null)
      showSuccess("Story atualizado!", "O destaque foi atualizado com sucesso")
    } catch (error) {
      console.error("[v0] Error updating story:", error)
      showError("Erro ao atualizar", "Não foi possível atualizar o story. Tente novamente.")
    } finally {
      setStoriesLoading(false)
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    const confirmed = await confirm(
      "Deletar Story",
      "Tem certeza que deseja deletar este destaque? Esta ação não pode ser desfeita.",
    )

    if (!confirmed) return

    setStoriesLoading(true)
    try {
      await deleteStory(storyId)
      const updatedStories = await getIsabelleStories()
      setStories(updatedStories)
      showSuccess("Story deletado!", "O destaque foi removido com sucesso")
    } catch (error) {
      console.error("[v0] Error deleting story:", error)
      showError("Erro ao deletar", "Não foi possível deletar o story. Tente novamente.")
    } finally {
      setStoriesLoading(false)
    }
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

  const getUserLevelColor = (level: "Bronze" | "Prata" | "Gold" | "Diamante") => {
    switch (level) {
      case "Bronze":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "Prata":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "Diamante":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
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

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "agora"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0)
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0)
  const totalRetweets = posts.reduce((sum, post) => sum + (post.retweets || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link href="/feed">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Painel Administrativo</h1>
          </div>
          <Button className="rounded-full glow-pink-hover" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </header>

      <div className="flex max-w-6xl mx-auto">
        <aside className="w-64 bg-card border-r p-4">
          <div className="space-y-2">
            {/* Visão Geral */}
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </Button>

            {/* Conteúdo */}
            <Collapsible
              open={menuExpanded.content}
              onOpenChange={(open) => setMenuExpanded((prev) => ({ ...prev, content: open }))}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Conteúdo
                  </span>
                  {menuExpanded.content ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-6">
                <Button
                  variant={activeTab === "posts" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("posts")}
                >
                  Posts
                </Button>
                <Button
                  variant={activeTab === "stories" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("stories")}
                >
                  Stories
                </Button>
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profile")}
                >
                  Perfil Isabelle
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Usuários */}
            <Collapsible
              open={menuExpanded.users}
              onOpenChange={(open) => setMenuExpanded((prev) => ({ ...prev, users: open }))}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Usuários
                  </span>
                  {menuExpanded.users ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-6">
                <Button
                  variant={activeTab === "users" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("users")}
                >
                  Gerenciar Usuários
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Comunicação */}
            <Collapsible
              open={menuExpanded.communication}
              onOpenChange={(open) => setMenuExpanded((prev) => ({ ...prev, communication: open }))}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comunicação
                    {unreadCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-red-500 text-white">{unreadCount}</Badge>
                    )}
                  </span>
                  {menuExpanded.communication ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-6">
                <Button
                  variant={activeTab === "chat" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("chat")}
                >
                  Chat
                  {unreadCount > 0 && (
                    <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-red-500 text-white">{unreadCount}</Badge>
                  )}
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Visão Geral</h2>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{posts.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Curtidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{formatNumber(totalLikes)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Comentários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-500">{formatNumber(totalComments)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Stories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-500">{stories.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Posts */}
              <Card>
                <CardHeader>
                  <CardTitle>Posts Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={post.authorProfileImage || "/placeholder.svg"}
                              alt={post.authorDisplayName}
                            />
                            <AvatarFallback>IL</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{post.content}</p>
                            <p className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Heart className="h-3 w-3 mr-1" />
                            {post.likes || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {post.comments || 0}
                          </span>
                          <span className="flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {post.retweets || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "posts" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Gerenciar Posts</h2>
                <Button className="rounded-full glow-pink-hover" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Post
                </Button>
              </div>

              <div className="grid gap-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={post.authorProfileImage || "/placeholder.svg"}
                                alt={post.authorDisplayName}
                              />
                              <AvatarFallback className="text-xs">IL</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{post.authorDisplayName}</span>
                            <span className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</span>
                          </div>

                          <p className="text-sm mb-3 leading-relaxed">{post.content}</p>

                          {post.images && post.images.length > 0 && (
                            <div className="mb-3">
                              <img
                                src={post.images[0] || "/placeholder.svg"}
                                alt="Post content"
                                className="w-32 h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {formatNumber(post.likes || 0)}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {formatNumber(post.comments || 0)}
                            </span>
                            <span className="flex items-center">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              {formatNumber(post.retweets || 0)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-red-500 hover:text-red-600"
                            onClick={() => post.id && handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "stories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerenciar Stories/Destaques
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create New Story */}
                <Card>
                  <CardHeader>
                    <CardTitle>Criar Novo Destaque</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Destaque</label>
                      <Input
                        value={newStory.name}
                        onChange={(e) => setNewStory((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Ensaios, Beauty, Lifestyle..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Imagem de Capa (9:16)</label>
                      <Input
                        value={newStory.coverImage}
                        onChange={(e) => setNewStory((prev) => ({ ...prev, coverImage: e.target.value }))}
                        placeholder="URL da imagem de capa"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nível de Acesso</label>
                      <Select
                        value={newStory.requiredLevel}
                        onValueChange={(value: "Bronze" | "Prata" | "Gold" | "Diamante") =>
                          setNewStory((prev) => ({ ...prev, requiredLevel: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bronze">Bronze - Todos</SelectItem>
                          <SelectItem value="Prata">Prata - Assinantes</SelectItem>
                          <SelectItem value="Gold">Gold - Premium</SelectItem>
                          <SelectItem value="Diamante">Diamante - VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Imagens do Story</label>
                      <Textarea
                        value={newStory.images.join("\n")}
                        onChange={(e) =>
                          setNewStory((prev) => ({
                            ...prev,
                            images: e.target.value.split("\n").filter((url) => url.trim()),
                          }))
                        }
                        placeholder="Uma URL por linha..."
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleCreateStory}
                      disabled={storiesLoading}
                      className="w-full rounded-full glow-pink-hover"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {storiesLoading ? "Criando..." : "Criar Destaque"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Edit Story */}
                {editingStory && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Editar Destaque</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome do Destaque</label>
                        <Input
                          value={editingStory.name}
                          onChange={(e) => setEditingStory((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                          placeholder="Nome do destaque"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Imagem de Capa</label>
                        <Input
                          value={editingStory.coverImage}
                          onChange={(e) =>
                            setEditingStory((prev) => (prev ? { ...prev, coverImage: e.target.value } : null))
                          }
                          placeholder="URL da imagem de capa"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nível de Acesso</label>
                        <Select
                          value={editingStory.requiredLevel}
                          onValueChange={(value: "Bronze" | "Prata" | "Gold" | "Diamante") =>
                            setEditingStory((prev) => (prev ? { ...prev, requiredLevel: value } : null))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bronze">Bronze - Todos</SelectItem>
                            <SelectItem value="Prata">Prata - Assinantes</SelectItem>
                            <SelectItem value="Gold">Gold - Premium</SelectItem>
                            <SelectItem value="Diamante">Diamante - VIP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Imagens do Story</label>
                        <Textarea
                          value={editingStory.images.join("\n")}
                          onChange={(e) =>
                            setEditingStory((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    images: e.target.value.split("\n").filter((url) => url.trim()),
                                  }
                                : null,
                            )
                          }
                          placeholder="Uma URL por linha..."
                          rows={4}
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={handleUpdateStory}
                          disabled={storiesLoading}
                          className="flex-1 rounded-full glow-pink-hover"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {storiesLoading ? "Salvando..." : "Salvar"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingStory(null)} className="rounded-full">
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Stories List */}
              <Card>
                <CardHeader>
                  <CardTitle>Destaques Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stories.map((story) => (
                      <div key={story.id} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStoryBadgeColor(story.requiredLevel)} p-0.5`}
                            >
                              <div className="w-full h-full rounded-full overflow-hidden">
                                <img
                                  src={story.coverImage || "/placeholder.svg"}
                                  alt={story.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium">{story.name}</h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getStoryBadgeColor(story.requiredLevel)} text-white`}
                              >
                                {story.requiredLevel}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full"
                              onClick={() => setEditingStory(story)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-red-500 hover:text-red-600"
                              onClick={() => story.id && handleDeleteStory(story.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {story.images.length} imagem(ns) • Criado em {formatTimestamp(story.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Gerenciar Perfil da Isabelle
                </h2>
                <Button className="rounded-full glow-pink-hover" onClick={handleSaveProfile} disabled={profileLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {profileLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview do Perfil */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preview do Perfil</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isabelleProfile.shortCover && (
                      <div className="rounded-lg overflow-hidden mb-4">
                        <img
                          src={isabelleProfile.shortCover || "/placeholder.svg"}
                          alt="Capa do perfil"
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 ring-4 ring-primary/20">
                        <AvatarImage src={isabelleProfile.profileImage || "/placeholder.svg"} alt="Isabelle Lua" />
                        <AvatarFallback className="text-xl">IL</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold">{isabelleProfile.displayName}</h3>
                          <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-xs">✓</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">@isabellelua</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {isabelleProfile.bio}
                    </p>

                    {isabelleProfile.socialLinks && Object.values(isabelleProfile.socialLinks).some((link) => link) && (
                      <div className="flex justify-center space-x-3 pt-2">
                        {isabelleProfile.socialLinks.youtube && (
                          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">YT</span>
                          </div>
                        )}
                        {isabelleProfile.socialLinks.tiktok && (
                          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                            <span className="text-white text-xs font-bold">TT</span>
                          </div>
                        )}
                        {isabelleProfile.socialLinks.instagram && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">IG</span>
                          </div>
                        )}
                        {isabelleProfile.socialLinks.twitter && (
                          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                            <span className="text-white text-xs font-bold">X</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Editar Perfil */}
                <Card>
                  <CardHeader>
                    <CardTitle>Editar Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome de Exibição</label>
                      <Input
                        value={isabelleProfile.displayName}
                        onChange={(e) => setIsIsabelleProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Nome que aparece no perfil"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={isabelleProfile.bio}
                        onChange={(e) => setIsIsabelleProfile((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Biografia do perfil"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Imagem do Perfil</label>
                      <Input
                        value={isabelleProfile.profileImage}
                        onChange={(e) => setIsIsabelleProfile((prev) => ({ ...prev, profileImage: e.target.value }))}
                        placeholder="URL da imagem do perfil"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Capa Curta do Perfil</label>
                      <Input
                        value={isabelleProfile.shortCover || ""}
                        onChange={(e) => setIsIsabelleProfile((prev) => ({ ...prev, shortCover: e.target.value }))}
                        placeholder="URL da capa curta (opcional)"
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Redes Sociais</h4>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-red-600">YouTube</label>
                        <Input
                          value={isabelleProfile.socialLinks?.youtube || ""}
                          onChange={(e) =>
                            setIsIsabelleProfile((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, youtube: e.target.value },
                            }))
                          }
                          placeholder="https://youtube.com/@canal"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">TikTok</label>
                        <Input
                          value={isabelleProfile.socialLinks?.tiktok || ""}
                          onChange={(e) =>
                            setIsIsabelleProfile((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, tiktok: e.target.value },
                            }))
                          }
                          placeholder="https://tiktok.com/@usuario"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-pink-600">Instagram</label>
                        <Input
                          value={isabelleProfile.socialLinks?.instagram || ""}
                          onChange={(e) =>
                            setIsIsabelleProfile((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                            }))
                          }
                          placeholder="https://instagram.com/usuario"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">X (Twitter)</label>
                        <Input
                          value={isabelleProfile.socialLinks?.twitter || ""}
                          onChange={(e) =>
                            setIsIsabelleProfile((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, twitter: e.target.value },
                            }))
                          }
                          placeholder="https://x.com/usuario"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Gerenciar Usuários
                </h2>
                <Button className="rounded-full glow-pink-hover" onClick={loadUsers} disabled={usersLoading}>
                  {usersLoading ? "Carregando..." : "Atualizar Lista"}
                </Button>
              </div>

              {/* Filtros */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nome de usuário..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={selectedLevel} onValueChange={(value: any) => setSelectedLevel(value)}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filtrar por nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os níveis</SelectItem>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="Prata">Prata</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Diamante">Diamante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Cadastrados ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {users.length === 0 ? "Nenhum usuário encontrado" : "Nenhum usuário corresponde aos filtros"}
                      </p>
                      {users.length === 0 && (
                        <Button variant="outline" className="mt-4 bg-transparent" onClick={loadUsers}>
                          Carregar Usuários
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.uid}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={user.profileImage || "/placeholder.svg"}
                                alt={user.displayName || user.username}
                              />
                              <AvatarFallback>
                                {(user.displayName || user.username).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{user.displayName || user.username}</h3>
                                {user.level === "Diamante" && <Crown className="h-4 w-4 text-blue-500" />}
                                {user.level === "Gold" && <Crown className="h-4 w-4 text-yellow-500" />}
                              </div>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                <span>{user.followers || 0} seguidores</span>
                                <span>{user.following || 0} seguindo</span>
                                <span>Desde {formatTimestamp(user.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Badge className={getUserLevelColor(user.level)}>{user.level}</Badge>
                            <Select
                              value={user.level}
                              onValueChange={(newLevel: "Bronze" | "Prata" | "Gold" | "Diamante") =>
                                handleChangeUserLevel(user.uid, newLevel)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bronze">Bronze</SelectItem>
                                <SelectItem value="Prata">Prata</SelectItem>
                                <SelectItem value="Gold">Gold</SelectItem>
                                <SelectItem value="Diamante">Diamante</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurar Mensagem Automática da Isabelle
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Esta mensagem será enviada automaticamente para todos os novos usuários que se cadastrarem
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mensagem de Boas-vindas</label>
                    <Textarea
                      placeholder="Digite a mensagem que a Isabelle enviará automaticamente para novos usuários..."
                      value={autoMessage}
                      onChange={(e) => setAutoMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">URL da Imagem (opcional)</label>
                    <Input
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={autoMessageImage}
                      onChange={(e) => setAutoMessageImage(e.target.value)}
                    />
                    {autoMessageImage && (
                      <div className="mt-2">
                        <img
                          src={autoMessageImage || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-xs rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      💡 Dica: Use uma imagem atrativa para gerar mais curiosidade nos usuários
                    </div>
                    <Button
                      onClick={handleSaveAutoMessage}
                      disabled={savingAutoMessage || !autoMessage.trim()}
                      className="glow-pink-hover"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savingAutoMessage ? "Salvando..." : "Salvar Mensagem"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Seção Chat em Tempo Real removida - sistema agora é totalmente automatizado */}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Sistema de Notificações
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="rounded-full text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 bg-transparent"
                    onClick={handleCleanIsabelleNotifications}
                    disabled={cleaningNotifications}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {cleaningNotifications ? "Limpando..." : "Limpar Antigas"}
                  </Button>
                  <Button
                    className="rounded-full glow-pink-hover"
                    onClick={loadNotificationTemplates}
                    disabled={notificationsLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {notificationsLoading ? "Carregando..." : "Atualizar"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Criar Nova Notificação */}
                <Card>
                  <CardHeader>
                    <CardTitle>Criar Nova Notificação</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Crie templates de notificação para enviar aos usuários
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Título da Notificação</label>
                      <Input
                        value={notificationTemplate.title}
                        onChange={(e) => setNotificationTemplate((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Bem-vindo à plataforma!"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mensagem</label>
                      <Textarea
                        value={notificationTemplate.message}
                        onChange={(e) => setNotificationTemplate((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Digite a mensagem da notificação..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo</label>
                        <Select
                          value={notificationTemplate.type}
                          onValueChange={(value: "welcome" | "promotion" | "announcement" | "custom") =>
                            setNotificationTemplate((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="welcome">Boas-vindas</SelectItem>
                            <SelectItem value="promotion">Promoção</SelectItem>
                            <SelectItem value="announcement">Anúncio</SelectItem>
                            <SelectItem value="custom">Personalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Público Alvo</label>
                        <Select
                          value={notificationTemplate.targetLevel}
                          onValueChange={(value: "all" | "Bronze" | "Prata" | "Gold" | "Diamante") =>
                            setNotificationTemplate((prev) => ({ ...prev, targetLevel: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os usuários</SelectItem>
                            <SelectItem value="Bronze">Bronze</SelectItem>
                            <SelectItem value="Prata">Prata</SelectItem>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Diamante">Diamante</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateNotificationTemplate}
                      disabled={notificationsLoading}
                      className="w-full rounded-full glow-pink-hover"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {notificationsLoading ? "Criando..." : "Criar Template"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview da Notificação */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preview da Notificação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage src="/isabelle-avatar.jpg" alt="Isabelle" />
                          <AvatarFallback>IL</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">Isabelle Lua</span>
                              <Badge variant="secondary" className="text-xs">
                                {notificationTemplate.type === "welcome" && "Boas-vindas"}
                                {notificationTemplate.type === "promotion" && "Promoção"}
                                {notificationTemplate.type === "announcement" && "Anúncio"}
                                {notificationTemplate.type === "custom" && "Personalizada"}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">agora</span>
                          </div>
                          <h4 className="font-medium text-sm mt-1">
                            {notificationTemplate.title || "Título da notificação"}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notificationTemplate.message || "Mensagem da notificação aparecerá aqui..."}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              Para:{" "}
                              {notificationTemplate.targetLevel === "all"
                                ? "Todos os usuários"
                                : notificationTemplate.targetLevel}
                            </span>
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Templates Existentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Templates de Notificação</CardTitle>
                  <p className="text-sm text-muted-foreground">Gerencie e envie notificações usando templates salvos</p>
                </CardHeader>
                <CardContent>
                  {notificationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Carregando templates...</p>
                    </div>
                  ) : notificationTemplates.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum template criado ainda</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crie seu primeiro template de notificação acima
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notificationTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium">{template.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {template.type === "welcome" && "Boas-vindas"}
                                  {template.type === "promotion" && "Promoção"}
                                  {template.type === "announcement" && "Anúncio"}
                                  {template.type === "custom" && "Personalizada"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {template.targetLevel === "all" ? "Todos" : template.targetLevel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{template.message}</p>
                              <p className="text-xs text-muted-foreground">
                                Criado em {formatTimestamp(template.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="default"
                                size="sm"
                                className="rounded-full glow-pink-hover"
                                onClick={() => handleSendNotification(template)}
                                disabled={sendingNotification}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                {sendingNotification ? "Enviando..." : "Enviar"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        </main>
      </div>

      {/* Modals */}
      <CreatePostModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      <EditPostModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedPost(null)
        }}
        post={selectedPost}
      />
    </div>
  )
}
