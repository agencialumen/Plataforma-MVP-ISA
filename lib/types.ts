export type UserLevel = "bronze" | "prata" | "gold" | "platinum" | "diamante"

export interface User {
  uid: string
  email: string
  username: string
  displayName: string
  photoURL?: string
  bio?: string
  retweets: number
  level: UserLevel
  subscriptionExpiry?: Date
  createdAt: Date
  xp: number
  totalXp: number
  completedMissions: string[]
  dailyMissionsReset?: Date
  weeklyMissionsReset?: Date
}

export interface Post {
  id: string
  content: string
  imageUrl?: string
  videoUrl?: string
  authorId: string
  authorName: string
  authorUsername: string
  authorPhotoURL?: string
  createdAt: Date
  likes: number
  comments: number
  retweets: number
  requiredLevel: UserLevel // Novo campo para controle de acesso
}

export interface Mission {
  id: string
  title: string
  description: string
  type: "daily" | "weekly" | "achievement"
  xpReward: number
  requiredLevel: UserLevel
  targetAction: "like" | "comment" | "retweet" | "view_story" | "send_gift"
  targetCount: number
  isActive: boolean
  expiresAt?: Date
}

export interface UserMissionProgress {
  missionId: string
  userId: string
  progress: number
  completed: boolean
  completedAt?: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "mission" | "level_up" | "xp_gained"
  isRead: boolean
  createdAt: Date
  actionUrl?: string
}

export const USER_LEVELS: { [key in UserLevel]: { name: string; color: string; price?: number } } = {
  bronze: { name: "Bronze", color: "#CD7F32" }, // Gratuito
  prata: { name: "Prata", color: "#C0C0C0" }, // Gratuito
  gold: { name: "Gold", color: "#FFD700" }, // Gratuito
  platinum: { name: "Platinum", color: "#E5E4E2", price: 29.9 },
  diamante: { name: "Diamante", color: "#06B6D4", price: 59.9 },
}

export const LEVEL_HIERARCHY: UserLevel[] = ["bronze", "prata", "gold", "platinum", "diamante"]

export const XP_REQUIREMENTS: { [key in UserLevel]: number } = {
  bronze: 0,
  prata: 500,
  gold: 1500,
  platinum: 3000,
  diamante: 6000,
}

export const DEFAULT_MISSIONS: Mission[] = [
  // Bronze
  {
    id: "bronze_like_1",
    title: "Primeira Curtida",
    description: "Curta 1 foto da Isabelle",
    type: "daily",
    xpReward: 50,
    requiredLevel: "bronze",
    targetAction: "like",
    targetCount: 1,
    isActive: true,
  },
  {
    id: "bronze_like_3",
    title: "Curtidas Diárias",
    description: "Curta 3 fotos da Isabelle",
    type: "daily",
    xpReward: 100,
    requiredLevel: "bronze",
    targetAction: "like",
    targetCount: 3,
    isActive: true,
  },
  // Prata
  {
    id: "prata_story_2",
    title: "Stories Exclusivos",
    description: "Veja 2 stories exclusivos da Isabelle",
    type: "daily",
    xpReward: 150,
    requiredLevel: "prata",
    targetAction: "view_story",
    targetCount: 2,
    isActive: true,
  },
  {
    id: "prata_retweet_1",
    title: "Primeiro Retweet",
    description: "Reposte 1 foto da Isabelle",
    type: "daily",
    xpReward: 120,
    requiredLevel: "prata",
    targetAction: "retweet",
    targetCount: 1,
    isActive: true,
  },
  // Gold
  {
    id: "gold_comment_2",
    title: "Comentários Ativos",
    description: "Comente em 2 publicações",
    type: "daily",
    xpReward: 200,
    requiredLevel: "gold",
    targetAction: "comment",
    targetCount: 2,
    isActive: true,
  },
  {
    id: "gold_retweet_2",
    title: "Compartilhamentos",
    description: "Reposte 2 fotos da Isabelle",
    type: "weekly",
    xpReward: 300,
    requiredLevel: "gold",
    targetAction: "retweet",
    targetCount: 2,
    isActive: true,
  },
  // Diamante
  {
    id: "diamante_gift_1",
    title: "Presente Especial",
    description: "Envie um presente para Isabelle",
    type: "weekly",
    xpReward: 500,
    requiredLevel: "diamante",
    targetAction: "send_gift",
    targetCount: 1,
    isActive: true,
  },
]

export function canAccessContent(userLevel: UserLevel, requiredLevel: UserLevel): boolean {
  const userIndex = LEVEL_HIERARCHY.indexOf(userLevel)
  const requiredIndex = LEVEL_HIERARCHY.indexOf(requiredLevel)
  return userIndex >= requiredIndex
}

export function getNextLevel(currentLevel: UserLevel): UserLevel | null {
  const currentIndex = LEVEL_HIERARCHY.indexOf(currentLevel)
  if (currentIndex < LEVEL_HIERARCHY.length - 1) {
    return LEVEL_HIERARCHY[currentIndex + 1]
  }
  return null
}

export function getXpForNextLevel(currentLevel: UserLevel): number {
  const nextLevel = getNextLevel(currentLevel)
  return nextLevel ? XP_REQUIREMENTS[nextLevel] : 0
}

export function calculateLevelFromXp(totalXp: number): UserLevel {
  for (let i = LEVEL_HIERARCHY.length - 1; i >= 0; i--) {
    const level = LEVEL_HIERARCHY[i]
    if (totalXp >= XP_REQUIREMENTS[level]) {
      return level
    }
  }
  return "bronze"
}
