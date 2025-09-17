import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc, // Adicionando setDoc para criar documentos
  writeBatch,
  startAfter,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { db, auth } from "./config"

// Tipos de dados
export interface UserProfile {
  uid: string
  username: string
  displayName: string
  bio: string
  profileImage: string
  level: "Gold" | "Premium" | "Diamante"
  createdAt: any
  updatedAt: any
  lastSeen?: any
  xp?: number
  totalXp?: number
}

export interface Post {
  id?: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  authorProfileImage: string
  content: string
  images: string[]
  videos: string[]
  likes: number
  comments: number
  retweets: number
  requiredLevel?: "Gold" | "Premium" | "Diamante"
  createdAt: any
  updatedAt: any
}

export interface Like {
  id?: string
  userId: string
  postId: string
  createdAt: any
}

export interface Comment {
  id?: string
  userId: string
  postId: string
  username: string
  displayName: string
  profileImage: string
  content: string
  createdAt: any
}

export interface Retweet {
  id?: string
  userId: string
  postId: string
  originalAuthorId: string
  createdAt: any
  originalPost?: any
}

export interface Notification {
  id?: string
  userId: string
  type: "message" | "welcome" | "upgrade" | "system" | "mission" | "level_up" | "xp_gained"
  title: string
  message: string
  actionUrl?: string
  fromUserId?: string
  fromUsername?: string
  fromDisplayName?: string
  fromProfileImage?: string
  isRead: boolean
  expiresAt: any
  createdAt: any
}

// Interfaces e funções para sistema de templates de notificação
export interface NotificationTemplate {
  id?: string
  title: string
  message: string
  type: "welcome" | "promotion" | "announcement" | "custom"
  targetLevel: "all" | "Bronze" | "Prata" | "Gold" | "Diamante"
  isActive: boolean
  createdAt: any
  createdBy: string
  scheduledFor?: string
}

// Funções para Posts
export const createPost = async (postData: Omit<Post, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creating post:", error)
    throw error
  }
}

export const getPosts = (callback: (posts: Post[]) => void) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50))

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[]
    callback(posts)
  })
}

export const getPostsByAuthor = async (authorUsername: string): Promise<Post[]> => {
  try {
    console.log("[v0] Getting posts by author:", authorUsername)
    const postsRef = collection(db, "posts")
    const q = query(postsRef, where("authorUsername", "==", authorUsername))
    const querySnapshot = await getDocs(q)

    console.log("[v0] Query snapshot size:", querySnapshot.size)

    const posts = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log("[v0] Post found:", { id: doc.id, authorUsername: data.authorUsername, content: data.content })
      return {
        id: doc.id,
        ...data,
      }
    }) as Post[]

    const sortedPosts = posts.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.toMillis() - a.createdAt.toMillis()
    })

    console.log("[v0] Total posts found for", authorUsername, ":", posts.length)
    return sortedPosts
  } catch (error) {
    console.error("[v0] Error getting posts by author:", error)
    return []
  }
}

export const getPostsPaginated = (
  callback: (posts: Post[], hasMore: boolean) => void,
  lastDoc?: any,
  limitCount = 10,
) => {
  let q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(limitCount))

  if (lastDoc) {
    q = query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitCount))
  }

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[]

    const hasMore = snapshot.docs.length === limitCount
    const lastDocument = snapshot.docs[snapshot.docs.length - 1]

    callback(posts, hasMore)
  })
}

// Funções para Perfis de Usuário
export const createUserProfile = async (profileData: Omit<UserProfile, "createdAt" | "updatedAt">) => {
  try {
    await updateDoc(doc(db, "users", profileData.uid), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error creating user profile:", error)
    throw error
  }
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting user profile:", error)
    throw error
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, "displayName" | "bio" | "profileImage" | "level" | "xp" | "totalXp">>,
) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    console.log("[v0] Profile updated successfully")
  } catch (error) {
    console.error("[v0] Error updating profile:", error)
    throw error
  }
}

// Funções para Curtidas
export const toggleLike = async (userId: string, postId: string) => {
  try {
    // Verificar nível do usuário
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado")
    }

    const userData = userDoc.data()
    const userLevel = userData.level || "bronze"

    // Verificar se o usuário pode curtir
    if (!canUserPerformAction(userLevel, "like")) {
      throw new Error("Seu nível não permite curtir posts")
    }

    const likesRef = collection(db, "likes")
    const q = query(likesRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Adicionar curtida
      await addDoc(likesRef, {
        userId,
        postId,
        createdAt: serverTimestamp(),
      })

      // Incrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(1),
      })

      const hasGainedXP = await hasUserGainedXPForPost(userId, postId, "like")
      let xpGained = 0

      if (!hasGainedXP) {
        xpGained = getXPForAction("like")
        await addXPToUser(userId, xpGained, "like")
        await trackXPGained(userId, postId, "like", xpGained)
      }

      return { liked: true, xpGained }
    } else {
      // Remover curtida
      const likeDoc = querySnapshot.docs[0]
      await deleteDoc(likeDoc.ref)

      // Decrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(-1),
      })

      return { liked: false, xpGained: 0 }
    }
  } catch (error) {
    console.error("[v0] Error toggling like:", error)
    throw error
  }
}

export const checkUserLiked = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const likesRef = collection(db, "likes")
    const q = query(likesRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    return !querySnapshot.empty
  } catch (error) {
    console.error("[v0] Error checking user liked:", error)
    return false
  }
}

// Funções para Retweets
export const toggleRetweet = async (userId: string, postId: string, originalAuthorId: string) => {
  try {
    // Verificar nível do usuário
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado")
    }

    const userData = userDoc.data()
    const userLevel = userData.level || "bronze"

    // Verificar se o usuário pode retuitar
    if (!canUserPerformAction(userLevel, "retweet")) {
      throw new Error("Seu nível não permite retuitar posts. Upgrade para Prata ou superior!")
    }

    const retweetsRef = collection(db, "retweets")
    const q = query(retweetsRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      const postDoc = await getDoc(doc(db, "posts", postId))
      if (!postDoc.exists()) {
        throw new Error("Post não encontrado")
      }

      const postData = postDoc.data()

      await addDoc(retweetsRef, {
        userId,
        postId,
        originalAuthorId,
        createdAt: serverTimestamp(),
        originalPost: {
          id: postId,
          content: postData.content || "",
          images: postData.images || [],
          authorDisplayName: postData.authorDisplayName || "",
          authorUsername: postData.authorUsername || "",
          authorProfileImage: postData.authorProfileImage || "/avatars/default.jpg",
          requiredLevel: postData.requiredLevel || "bronze", // Valor padrão para posts antigos
          createdAt: postData.createdAt || serverTimestamp(),
          likes: postData.likes || 0,
          comments: postData.comments || 0,
          retweets: postData.retweets || 0,
        },
      })

      // Incrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        retweets: increment(1),
      })

      const hasGainedXP = await hasUserGainedXPForPost(userId, postId, "retweet")
      let xpGained = 0

      if (!hasGainedXP) {
        xpGained = getXPForAction("retweet")
        await addXPToUser(userId, xpGained, "retweet")
        await trackXPGained(userId, postId, "retweet", xpGained)
      }

      return { retweeted: true, xpGained }
    } else {
      // Remover retweet
      const retweetDoc = querySnapshot.docs[0]
      await deleteDoc(retweetDoc.ref)

      // Decrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        retweets: increment(-1),
      })

      return { retweeted: false, xpGained: 0 }
    }
  } catch (error) {
    console.error("[v0] Error toggling retweet:", error)
    throw error
  }
}

export const getUserRetweets = async (userId: string) => {
  try {
    const retweetsRef = collection(db, "retweets")
    const q = query(retweetsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    const retweets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return retweets.sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime // ordem decrescente (mais recente primeiro)
    })
  } catch (error) {
    console.error("[v0] Error getting user retweets:", error)
    return []
  }
}

export const checkUserRetweeted = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const retweetsRef = collection(db, "retweets")
    const q = query(retweetsRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    return !querySnapshot.empty
  } catch (error) {
    console.error("[v0] Error checking user retweeted:", error)
    return false
  }
}

// Funções para Comentários
export const addComment = async (commentData: Omit<Comment, "id" | "createdAt">) => {
  try {
    // Verificar nível do usuário
    const userDoc = await getDoc(doc(db, "users", commentData.userId))
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado")
    }

    const userData = userDoc.data()
    const userLevel = userData.level || "bronze"

    // Verificar se o usuário pode comentar
    if (!canUserPerformAction(userLevel, "comment")) {
      throw new Error("Seu nível não permite comentar. Upgrade para Gold ou superior!")
    }

    const docRef = await addDoc(collection(db, "comments"), {
      ...commentData,
      createdAt: serverTimestamp(),
    })

    // Incrementar contador de comentários no post
    await updateDoc(doc(db, "posts", commentData.postId), {
      comments: increment(1),
    })

    // Adicionar XP ao usuário
    const xpGained = getXPForAction("comment")
    await addXPToUser(commentData.userId, xpGained, "comment")

    return { commentId: docRef.id, xpGained }
  } catch (error) {
    console.error("[v0] Error adding comment:", error)
    throw error
  }
}

export const getPostComments = (postId: string, callback: (comments: Comment[]) => void) => {
  const q = query(collection(db, "comments"), where("postId", "==", postId))

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[]

    // Ordenar no lado do cliente para evitar índice composto
    const sortedComments = comments.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.toMillis() - a.createdAt.toMillis()
    })

    callback(sortedComments)
  })
}

// Funções adicionais
export const ensureUserDocument = async (uid: string, userData?: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log("[v0] Creating user document with data:", userData)

      const defaultUserData = {
        uid,
        username: userData?.username || `user_${uid.slice(0, 8)}`,
        displayName: userData?.displayName || userData?.username || "Usuário",
        bio: userData?.bio || "",
        profileImage: userData?.profileImage || "",
        level: "Gold", // Gold é o nível gratuito padrão
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        xp: 0,
        totalXp: 0,
      }

      await setDoc(userRef, defaultUserData, { merge: true })
      console.log("[v0] User document created with username:", defaultUserData.username)
    } else {
      if (userData && userData.username) {
        await updateDoc(userRef, {
          username: userData.username,
          displayName: userData.displayName || userData.username,
          updatedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        })
        console.log("[v0] User document updated with username:", userData.username)
      }
    }
  } catch (error) {
    console.error("[v0] Error ensuring user document:", error)
    throw error
  }
}

export const updateUserLastSeen = async (uid: string) => {
  try {
    // Primeiro garantir que o documento existe
    await ensureUserDocument(uid)

    // Depois atualizar o lastSeen
    await updateDoc(doc(db, "users", uid), {
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error updating last seen:", error)
    // Não relançar o erro para não quebrar a aplicação
  }
}

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    // Decodificar a URL para lidar com espaços (%20)
    const decodedUsername = decodeURIComponent(username)

    // Caso especial para o perfil da Isabelle
    if (decodedUsername === "isabellelua") {
      const isabelleProfile = await ensureIsabelleProfile()
      return {
        uid: "isabelle-lua-uid",
        username: "isabellelua",
        displayName: isabelleProfile.displayName,
        bio: isabelleProfile.bio,
        profileImage: isabelleProfile.profileImage,
        level: "Gold",
        createdAt: isabelleProfile.createdAt,
        updatedAt: isabelleProfile.updatedAt,
      } as UserProfile
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("username", "==", decodedUsername), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { uid: doc.id, ...doc.data() } as UserProfile
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting user by username:", error)
    return null
  }
}

// Funções para deletar posts
export const deletePost = async (postId: string) => {
  try {
    console.log("[v0] Deleting post:", postId)

    // Deletar o post
    await deleteDoc(doc(db, "posts", postId))

    // Deletar todas as curtidas relacionadas
    const likesRef = collection(db, "likes")
    const likesQuery = query(likesRef, where("postId", "==", postId))
    const likesSnapshot = await getDocs(likesQuery)

    const deletePromises = []
    likesSnapshot.forEach((likeDoc) => {
      deletePromises.push(deleteDoc(likeDoc.ref))
    })

    // Deletar todos os comentários relacionados
    const commentsRef = collection(db, "comments")
    const commentsQuery = query(commentsRef, where("postId", "==", postId))
    const commentsSnapshot = await getDocs(commentsQuery)

    commentsSnapshot.forEach((commentDoc) => {
      deletePromises.push(deleteDoc(commentDoc.ref))
    })

    // Deletar todos os retweets relacionados
    const retweetsRef = collection(db, "retweets")
    const retweetsQuery = query(retweetsRef, where("postId", "==", postId))
    const retweetsSnapshot = await getDocs(retweetsQuery)

    retweetsSnapshot.forEach((retweetDoc) => {
      deletePromises.push(deleteDoc(retweetDoc.ref))
    })

    // Executar todas as deleções
    await Promise.all(deletePromises)

    console.log("[v0] Post and related data deleted successfully")
    return true
  } catch (error) {
    console.error("[v0] Error deleting post:", error)
    throw error
  }
}

// Funções para perfil específico da Isabelle
export const getIsabelleProfile = async () => {
  try {
    const docRef = doc(db, "profiles", "isabelle-lua")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    }

    // Retornar dados padrão se não existir
    return {
      displayName: "Isabelle Lua",
      bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
      profileImage: "/beautiful-woman-profile.png",
    }
  } catch (error) {
    console.error("[v0] Error getting Isabelle profile:", error)
    // Retornar dados padrão em caso de erro
    return {
      displayName: "Isabelle Lua",
      bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
      profileImage: "/beautiful-woman-profile.png",
    }
  }
}

export const saveIsabelleProfile = async (profileData: any) => {
  try {
    await setDoc(
      doc(db, "profiles", "isabelle-lua"),
      {
        ...profileData,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    console.log("[v0] Isabelle profile saved successfully")
  } catch (error) {
    console.error("[v0] Error saving Isabelle profile:", error)
    throw error
  }
}

export const ensureIsabelleProfile = async () => {
  try {
    const docRef = doc(db, "profiles", "isabelle-lua")
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log("[v0] Creating Isabelle profile document...")

      const defaultIsabelleProfile = {
        displayName: "Isabelle Lua",
        bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
        profileImage: "/beautiful-woman-profile.png",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(docRef, defaultIsabelleProfile)
      console.log("[v0] Isabelle profile created successfully")
      return defaultIsabelleProfile
    }

    return docSnap.data()
  } catch (error) {
    console.error("[v0] Error ensuring Isabelle profile:", error)
    throw error
  }
}

export const ensureIsabelleUserDocument = async () => {
  try {
    const isabelleUid = "isabelle-lua-uid"
    const userRef = doc(db, "users", isabelleUid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log("[v0] Creating Isabelle user document...")

      const isabelleProfile = await getIsabelleProfile()

      const isabelleUserData = {
        uid: isabelleUid,
        username: "isabellelua",
        displayName: isabelleProfile.displayName,
        bio: isabelleProfile.bio,
        profileImage: isabelleProfile.profileImage,
        level: "Gold",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        xp: 0,
        totalXp: 0,
      }

      await setDoc(userRef, isabelleUserData)
      console.log("[v0] Isabelle user document created successfully")
      return isabelleUserData
    }

    return { uid: isabelleUid, ...userSnap.data() }
  } catch (error) {
    console.error("[v0] Error ensuring Isabelle user document:", error)
    throw error
  }
}

export const createNotificationWithExpiry = async (notificationData: {
  userId: string
  type: "message" | "welcome" | "upgrade" | "system"
  title: string
  message: string
  fromUserId?: string
  fromUsername?: string
  fromDisplayName?: string
  fromProfileImage?: string
}) => {
  try {
    // Calcular data de expiração (24 horas a partir de agora)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await addDoc(collection(db, "notifications"), {
      ...notificationData,
      isRead: false,
      expiresAt: expiresAt,
      createdAt: serverTimestamp(),
    })

    console.log("[v0] Notification created with 24h expiry:", notificationData.type)
  } catch (error) {
    console.error("[v0] Error creating notification:", error)
    throw error
  }
}

export const cleanExpiredNotifications = async () => {
  try {
    const now = new Date()
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("expiresAt", "<=", now))
    const querySnapshot = await getDocs(q)

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    console.log(`[v0] Cleaned ${querySnapshot.docs.length} expired notifications`)
  } catch (error) {
    console.error("[v0] Error cleaning expired notifications:", error)
  }
}

export const getActiveUserNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), limit(50))

  return onSnapshot(q, (snapshot) => {
    const now = new Date()
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[]

    const activeNotifications = notifications
      .filter((notification) => {
        if (!notification.expiresAt) return false
        const expiresDate = notification.expiresAt.toDate
          ? notification.expiresAt.toDate()
          : new Date(notification.expiresAt)
        return expiresDate > now
      })
      .sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
        return bDate.getTime() - aDate.getTime()
      })
      .slice(0, 10)

    callback(activeNotifications)
  })
}

export const createIsabelleMessageNotification = async (userId: string) => {
  try {
    await createNotificationWithExpiry({
      userId,
      type: "message",
      title: "Nova mensagem da Isabelle! 💕",
      message: "A Isabelle acabou de te enviar uma mensagem especial!",
      fromUserId: "isabelle-lua-uid",
      fromUsername: "isabellelua",
      fromDisplayName: "Isabelle Lua",
      fromProfileImage: "/beautiful-woman-profile.png",
    })
  } catch (error) {
    console.error("[v0] Error creating Isabelle message notification:", error)
  }
}

export const createNotification = async (notificationData: {
  userId: string
  type: string
  message: string
  fromUserId?: string
  fromUsername?: string
  fromDisplayName?: string
  fromProfileImage?: string
}) => {
  try {
    await addDoc(collection(db, "notifications"), {
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error creating notification:", error)
    throw error
  }
}

export const getUserNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), limit(20))

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    const sortedNotifications = notifications.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.toMillis() - a.createdAt.toMillis()
    })

    callback(sortedNotifications)
  })
}

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
    })
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
    throw error
  }
}

export const deleteNotification = async (notificationId: string) => {
  try {
    await deleteDoc(doc(db, "notifications", notificationId))
    console.log("[v0] Notification deleted successfully:", notificationId)
  } catch (error) {
    console.error("[v0] Error deleting notification:", error)
  }
}

export const deleteFollowNotifications = async (userId: string) => {
  try {
    const notificationsRef = collection(db, "notifications")
    const q = query(notificationsRef, where("userId", "==", userId), where("type", "==", "follow"))
    const querySnapshot = await getDocs(q)

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))

    await Promise.all(deletePromises)
    console.log("[v0] All follow notifications deleted for user:", userId)
  } catch (error) {
    console.error("[v0] Error deleting follow notifications:", error)
  }
}

export const updatePostCounters = async (
  postId: string,
  counters: {
    likes?: number
    comments?: number
    retweets?: number
  },
) => {
  try {
    const updateData: any = {}

    if (counters.likes !== undefined) {
      updateData.likes = Math.max(0, counters.likes)
    }
    if (counters.comments !== undefined) {
      updateData.comments = Math.max(0, counters.comments)
    }
    if (counters.retweets !== undefined) {
      updateData.retweets = Math.max(0, counters.retweets)
    }

    updateData.updatedAt = serverTimestamp()

    await updateDoc(doc(db, "posts", postId), updateData)
    console.log("[v0] Post counters updated successfully:", { postId, counters })
    return true
  } catch (error) {
    console.error("[v0] Error updating post counters:", error)
    throw error
  }
}

export const incrementPostCounter = async (
  postId: string,
  counterType: "likes" | "comments" | "retweets",
  amount = 1,
) => {
  try {
    const updateData: any = {
      [counterType]: increment(amount),
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, "posts", postId), updateData)
    console.log("[v0] Post counter incremented:", { postId, counterType, amount })
    return true
  } catch (error) {
    console.error("[v0] Error incrementing post counter:", error)
    throw error
  }
}

// Função para atualizar nível do usuário
export const updateUserLevel = async (uid: string, level: "Gold" | "Premium" | "Diamante") => {
  try {
    await updateDoc(doc(db, "users", uid), {
      level,
      updatedAt: serverTimestamp(),
    })
    console.log("[v0] User level updated:", { uid, level })
  } catch (error) {
    console.error("[v0] Error updating user level:", error)
    throw error
  }
}

export const getCurrentUserLevel = async (uid: string): Promise<"Gold" | "Premium" | "Diamante"> => {
  try {
    const userProfile = await getUserProfile(uid)
    return userProfile?.level || "Gold"
  } catch (error) {
    console.error("[v0] Error getting current user level:", error)
    return "Gold"
  }
}

// Funções adicionais para sistema de XP e verificação de níveis
export const addXPToUser = async (userId: string, xpAmount: number, action: string) => {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.error("[v0] User document not found")
      return
    }

    const userData = userDoc.data()
    const currentXP = userData.xp || 0
    const currentTotalXP = userData.totalXp || 0
    const currentLevel = userData.level || "bronze"

    const newXP = currentXP + xpAmount
    const newTotalXP = currentTotalXP + xpAmount

    // Calcular novo nível baseado no XP total
    const newLevel = calculateLevelFromXP(newTotalXP)
    const levelChanged = newLevel !== currentLevel

    await updateDoc(userRef, {
      xp: newXP,
      totalXp: newTotalXP,
      level: newLevel,
      updatedAt: serverTimestamp(),
    })

    // Se o nível mudou, criar notificação
    if (levelChanged) {
      await addNotification(userId, {
        title: "Nível aumentado!",
        message: `Parabéns! Você alcançou o nível ${newLevel.toUpperCase()}!`,
        type: "level_up",
      })
    }

    return { newXP, newTotalXP, newLevel, levelChanged }
  } catch (error) {
    console.error("[v0] Error adding XP to user:", error)
    throw error
  }
}

export const calculateLevelFromXP = (totalXP: number): string => {
  if (totalXP >= 6000) return "diamante"
  if (totalXP >= 3000) return "platinum"
  if (totalXP >= 1500) return "gold"
  if (totalXP >= 500) return "prata"
  return "bronze"
}

export const canUserPerformAction = (userLevel: string, action: "like" | "comment" | "retweet"): boolean => {
  const levelHierarchy = ["bronze", "prata", "gold", "platinum", "diamante"]
  const userLevelIndex = levelHierarchy.indexOf(userLevel.toLowerCase())

  switch (action) {
    case "like":
      return userLevelIndex >= 0 // Bronze pode curtir
    case "comment":
      return userLevelIndex >= 2 // Gold pode comentar
    case "retweet":
      return userLevelIndex >= 1 // Prata pode retuitar
    default:
      return false
  }
}

export const getXPForAction = (action: "like" | "comment" | "retweet"): number => {
  switch (action) {
    case "like":
      return 100
    case "comment":
      return 200
    case "retweet":
      return 150
    default:
      return 0
  }
}

export const addNotification = async (
  userId: string,
  notification: {
    title: string
    message: string
    type: "mission" | "level_up" | "xp_gained"
    actionUrl?: string
  },
) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error adding notification:", error)
  }
}

export const hasUserGainedXPForPost = async (userId: string, postId: string, action: string): Promise<boolean> => {
  try {
    const xpTrackingRef = collection(db, "xp_tracking")
    const q = query(
      xpTrackingRef,
      where("userId", "==", userId),
      where("postId", "==", postId),
      where("action", "==", action),
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error("[v0] Error checking XP tracking:", error)
    return false
  }
}

export const trackXPGained = async (userId: string, postId: string, action: string, xpAmount: number) => {
  try {
    const xpTrackingRef = collection(db, "xp_tracking")
    await addDoc(xpTrackingRef, {
      userId,
      postId,
      action,
      xpAmount,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error tracking XP:", error)
  }
}

export const removeXPTracking = async (userId: string, postId: string, action: string) => {
  try {
    const xpTrackingRef = collection(db, "xp_tracking")
    const q = query(
      xpTrackingRef,
      where("userId", "==", userId),
      where("postId", "==", postId),
      where("action", "==", action),
    )
    const querySnapshot = await getDocs(q)

    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref)
    }
  } catch (error) {
    console.error("[v0] Error removing XP tracking:", error)
  }
}

// Funções para gerenciamento de stories
export interface Story {
  id?: string
  name: string
  coverImage: string
  requiredLevel: "Bronze" | "Prata" | "Gold" | "Diamante"
  images: string[]
  createdAt: any
  updatedAt: any
}

// Função para obter stories da Isabelle
export const getIsabelleStories = async (): Promise<Story[]> => {
  try {
    const storiesRef = collection(db, "isabelle-stories")
    const q = query(storiesRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const stories = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Story[]

    return stories
  } catch (error) {
    console.error("[v0] Error getting Isabelle stories:", error)
    return [
      {
        id: "default-1",
        name: "Ensaios",
        coverImage: "/glamorous-photoshoot-studio-lighting.png",
        requiredLevel: "Prata",
        images: ["/glamorous-photoshoot-studio-lighting.png"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default-2",
        name: "Lifestyle",
        coverImage: "/sunset-beach-silhouette-peaceful.png",
        requiredLevel: "Gold",
        images: ["/sunset-beach-silhouette-peaceful.png"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default-3",
        name: "Beauty",
        coverImage: "/skincare-routine-luxury-products.png",
        requiredLevel: "Premium",
        images: ["/skincare-routine-luxury-products.png"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "default-4",
        name: "Fitness",
        coverImage: "/fitness-workout-gym-woman.png",
        requiredLevel: "Diamante",
        images: ["/fitness-workout-gym-woman.png"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
  }
}

// Função para criar um novo story
export const createStory = async (storyData: Omit<Story, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "isabelle-stories"), {
      ...storyData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log("[v0] Story created successfully:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creating story:", error)
    throw error
  }
}

// Função para atualizar um story
export const updateStory = async (storyId: string, updates: Partial<Story>) => {
  try {
    await updateDoc(doc(db, "isabelle-stories", storyId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    console.log("[v0] Story updated successfully:", storyId)
  } catch (error) {
    console.error("[v0] Error updating story:", error)
    throw error
  }
}

// Função para deletar um story
export const deleteStory = async (storyId: string) => {
  try {
    await deleteDoc(doc(db, "isabelle-stories", storyId))
    console.log("[v0] Story deleted successfully:", storyId)
  } catch (error) {
    console.error("[v0] Error deleting story:", error)
  }
}

// Função para obter um story específico
export const getStoryById = async (storyId: string): Promise<Story | null> => {
  try {
    const docRef = doc(db, "isabelle-stories", storyId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Story
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting story by ID:", error)
    return null
  }
}

// Função para limpar mensagens antigas de um usuário
export const clearOldMessages = async (userId: string) => {
  try {
    console.log("[v0] Clearing old messages for user:", userId)

    const messagesRef = collection(db, "chatMessages")
    const q = query(messagesRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    console.log(`[v0] Cleared ${querySnapshot.docs.length} old messages for user:`, userId)
  } catch (error) {
    console.error("[v0] Error clearing old messages:", error)
    throw error
  }
}

// Função para criar uma mensagem de boas-vindas para um usuário
export const createWelcomeMessage = async (userId: string) => {
  try {
    await clearOldMessages(userId)

    let welcomeMessage =
      "Olá! 💕 Bem-vindo(a) ao DeLuxe Isa! Sou a Isabelle e estou muito feliz em te ter aqui comigo! ✨"
    let welcomeImage = ""

    try {
      const configRef = doc(db, "config", "autoWelcomeMessage")
      const configSnap = await getDoc(configRef)

      if (configSnap.exists()) {
        const configData = configSnap.data()
        if (configData.message) {
          welcomeMessage = configData.message
        }
        if (configData.image) {
          welcomeImage = configData.image
        }
      }
    } catch (configError) {
      console.log("[v0] Using default welcome message (config not found)")
    }

    const messageData = {
      userId,
      userName: "Usuário",
      userLevel: "Gold",
      message: welcomeMessage,
      timestamp: serverTimestamp(),
      isRead: false,
      adminReply: null,
      isWelcomeMessage: true,
      ...(welcomeImage && { image: welcomeImage }),
    }

    await addDoc(collection(db, "chatMessages"), messageData)
    console.log("[v0] Welcome message created for user:", userId)
  } catch (error) {
    console.error("[v0] Error creating welcome message:", error)
    throw error
  }
}

// Função para recriar mensagem de boas-vindas para usuários existentes
export const recreateWelcomeMessage = async (userId: string) => {
  try {
    console.log("[v0] Recreating welcome message for existing user:", userId)
    await createWelcomeMessage(userId)
  } catch (error) {
    console.error("[v0] Error recreating welcome message:", error)
  }
}

// Funções para templates de notificação
export const createNotificationTemplate = async (templateData: Omit<NotificationTemplate, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, "notificationTemplates"), {
      ...templateData,
      createdAt: serverTimestamp(),
    })
    console.log("[v0] Notification template created:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creating notification template:", error)
    throw error
  }
}

export const getNotificationTemplates = async (): Promise<NotificationTemplate[]> => {
  try {
    const q = query(collection(db, "notificationTemplates"), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as NotificationTemplate[]
  } catch (error) {
    console.error("[v0] Error getting notification templates:", error)
    return []
  }
}

export const deleteNotificationTemplate = async (templateId: string) => {
  try {
    await deleteDoc(doc(db, "notificationTemplates", templateId))
    console.log("[v0] Notification template deleted:", templateId)
  } catch (error) {
    console.error("[v0] Error deleting notification template:", error)
  }
}

export const sendBulkNotifications = async (template: NotificationTemplate) => {
  try {
    // Buscar usuários baseado no nível alvo
    const usersRef = collection(db, "users")
    let usersQuery = query(usersRef)

    if (template.targetLevel !== "all") {
      usersQuery = query(usersRef, where("level", "==", template.targetLevel))
    }

    const usersSnapshot = await getDocs(usersQuery)
    const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Filtrar usuário da Isabelle
    const targetUsers = users.filter((user) => user.id !== "isabelle-lua-uid")

    // Criar notificações em lote
    const batch = writeBatch(db)
    const notificationsRef = collection(db, "notifications")

    targetUsers.forEach((user) => {
      const notificationRef = doc(notificationsRef)
      batch.set(notificationRef, {
        userId: user.id,
        title: template.title,
        message: template.message,
        type: template.type,
        isRead: false,
        createdAt: serverTimestamp(),
        senderName: "Isabelle Lua",
        senderImage: "/beautiful-woman-profile.png",
        fromUserId: "isabelle-lua-uid",
        fromUsername: "isabellelua",
        fromDisplayName: "Isabelle Lua",
        fromProfileImage: "/beautiful-woman-profile.png",
        // Adicionar expiração de 24 horas
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
    })

    await batch.commit()

    console.log(`[v0] Bulk notifications sent to ${targetUsers.length} users`)
    return targetUsers.length
  } catch (error) {
    console.error("[v0] Error sending bulk notifications:", error)
    throw error
  }
}

export const createWelcomeNotification = async (userId: string) => {
  try {
    // Verificar se existe um template de boas-vindas ativo
    const templatesRef = collection(db, "notificationTemplates")
    const q = query(templatesRef, where("type", "==", "welcome"), where("isActive", "==", true), limit(1))
    const templateSnapshot = await getDocs(q)

    if (!templateSnapshot.empty) {
      const template = templateSnapshot.docs[0].data() as NotificationTemplate

      await createNotificationWithExpiry({
        userId,
        type: "welcome",
        title: template.title,
        message: template.message,
        fromUserId: "isabelle-lua-uid",
        fromUsername: "isabellelua",
        fromDisplayName: "Isabelle Lua",
        fromProfileImage: "/beautiful-woman-profile.png",
      })

      console.log("[v0] Welcome notification sent using template")
    } else {
      // Fallback para notificação padrão
      await createNotificationWithExpiry({
        userId,
        type: "welcome",
        title: "Bem-vindo à plataforma! 💕",
        message:
          "Olá! Seja muito bem-vindo à minha plataforma exclusiva. Aqui você terá acesso a conteúdos especiais e poderá interagir comigo de forma única!",
        fromUserId: "isabelle-lua-uid",
        fromUsername: "isabellelua",
        fromDisplayName: "Isabelle Lua",
        fromProfileImage: "/beautiful-woman-profile.png",
      })

      console.log("[v0] Default welcome notification sent")
    }
  } catch (error) {
    console.error("[v0] Error creating welcome notification:", error)
  }
}

// Função para remover notificações antigas da Isabelle
export const deleteIsabelleNotifications = async (userId?: string) => {
  try {
    const notificationsRef = collection(db, "notifications")
    let q

    if (userId) {
      // Remove notificações da Isabelle para um usuário específico
      q = query(notificationsRef, where("userId", "==", userId), where("fromUserId", "==", "isabelle-lua-uid"))
    } else {
      // Remove todas as notificações da Isabelle
      q = query(notificationsRef, where("fromUserId", "==", "isabelle-lua-uid"))
    }

    const querySnapshot = await getDocs(q)
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))

    await Promise.all(deletePromises)
    console.log(`[v0] Deleted ${querySnapshot.docs.length} Isabelle notifications`)
    return querySnapshot.docs.length
  } catch (error) {
    console.error("[v0] Error deleting Isabelle notifications:", error)
    throw error
  }
}

export const forceDeleteIsabelleNotifications = async (): Promise<{
  success: boolean
  removedCount: number
  message: string
}> => {
  try {
    console.log("[v0] Iniciando busca forçada por notificações da Isabelle...")

    // Buscar todas as notificações
    const notificationsRef = collection(db, "notifications")
    const allNotificationsSnapshot = await getDocs(notificationsRef)

    const isabelleNotifications: any[] = []

    // Filtrar notificações que contenham "Isabelle" em qualquer campo
    allNotificationsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const title = data.title?.toLowerCase() || ""
      const message = data.message?.toLowerCase() || ""
      const fromDisplayName = data.fromDisplayName?.toLowerCase() || ""

      if (
        title.includes("isabelle") ||
        message.includes("isabelle") ||
        fromDisplayName.includes("isabelle") ||
        title.includes("nova mensagem da isabelle") ||
        message.includes("acabou de te enviar uma mensagem especial")
      ) {
        isabelleNotifications.push({
          id: doc.id,
          data: data,
        })
      }
    })

    console.log(`[v0] Encontradas ${isabelleNotifications.length} notificações da Isabelle`)

    // Remover cada notificação encontrada
    let removedCount = 0
    for (const notification of isabelleNotifications) {
      try {
        await deleteDoc(doc(db, "notifications", notification.id))
        removedCount++
        console.log(`[v0] Removida notificação da Isabelle: ${notification.id}`)
      } catch (error) {
        console.error(`[v0] Erro ao remover notificação ${notification.id}:`, error)
      }
    }

    return {
      success: true,
      removedCount,
      message: `${removedCount} notificações da Isabelle foram removidas com sucesso!`,
    }
  } catch (error) {
    console.error("[v0] Erro durante a limpeza forçada das notificações:", error)
    return {
      success: false,
      removedCount: 0,
      message: `Erro ao remover notificações: ${error}`,
    }
  }
}

// Funções otimizadas para verificar likes em batch
export const checkUserLikedBatch = async (userId: string, postIds: string[]): Promise<Set<string>> => {
  if (postIds.length === 0) return new Set()

  try {
    const likesRef = collection(db, "likes")
    const q = query(likesRef, where("userId", "==", userId), where("postId", "in", postIds.slice(0, 10))) // Firestore limit
    const querySnapshot = await getDocs(q)

    const likedSet = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      likedSet.add(data.postId)
    })

    return likedSet
  } catch (error) {
    console.error("[v0] Error checking liked posts in batch:", error)
    return new Set()
  }
}

// Funções otimizadas para verificar retweets em batch
export const checkUserRetweetedBatch = async (userId: string, postIds: string[]): Promise<Set<string>> => {
  if (postIds.length === 0) return new Set()

  try {
    const retweetsRef = collection(db, "retweets")
    const q = query(retweetsRef, where("userId", "==", userId), where("postId", "in", postIds.slice(0, 10))) // Firestore limit
    const querySnapshot = await getDocs(q)

    const retweetedSet = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      retweetedSet.add(data.postId)
    })

    return retweetedSet
  } catch (error) {
    console.error("[v0] Error checking retweeted posts in batch:", error)
    return new Set()
  }
}

// Funções adicionais para sistema de XP e verificação de níveis
export const checkContentAccess = (userLevel: string, requiredLevel: string): boolean => {
  // Hierarquia correta dos níveis
  const levelOrder = {
    bronze: 1,
    prata: 2,
    gold: 3, // Nível gratuito mais alto
    platinum: 4, // Nível pago
    diamante: 5, // Nível premium
  }

  const userLevelNormalized = userLevel.toLowerCase()
  const requiredLevelNormalized = requiredLevel.toLowerCase()

  // Se o conteúdo é "gold gratuito", qualquer nível prata ou superior pode acessar
  if (requiredLevelNormalized === "gold") {
    return levelOrder[userLevelNormalized as keyof typeof levelOrder] >= levelOrder.prata
  }

  return (
    levelOrder[userLevelNormalized as keyof typeof levelOrder] >=
    levelOrder[requiredLevelNormalized as keyof typeof levelOrder]
  )
}

// Funções adicionais
export const getCurrentUser = async () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}
