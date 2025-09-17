import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "./config"
import { ensureUserDocument, getUserByUsername, createWelcomeMessage, createWelcomeNotification } from "./firestore"
import { getRandomAvatar } from "@/lib/avatars"

export interface UserProfile {
  uid: string
  username: string
  email: string
  displayName: string
  bio: string
  avatar: string
  createdAt: Date
}

export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth)
  return { user, loading, error }
}

// Create user with username (using email format for Firebase)
export const createUser = async (
  username: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    if (!auth) {
      console.error("[v0] Firebase auth not initialized")
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return { user: null, error: "Nome de usuário já está em uso" }
    }

    console.log("[v0] Creating user with username:", username)
    const email = `${username}@deluxeisa.app`
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log("[v0] User created successfully:", userCredential.user.uid)

    await updateProfile(userCredential.user, {
      displayName: username,
    })

    const userProfile = {
      username,
      displayName: username,
      bio: "",
      avatar: getRandomAvatar(),
      email,
      createdAt: new Date(),
    }

    await ensureUserDocument(userCredential.user.uid, userProfile)
    console.log("[v0] User document created in Firestore")

    await createWelcomeNotification(userCredential.user.uid)
    console.log("[v0] Welcome notification created for new user")

    await createWelcomeMessage(userCredential.user.uid)
    console.log("[v0] Welcome message created for new user")

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error("[v0] Error creating user:", error)
    return { user: null, error: "Erro ao criar conta. Tente novamente." }
  }
}

// Sign in user
export const signInUser = async (
  username: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    if (!auth) {
      console.error("[v0] Firebase auth not initialized")
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    console.log("[v0] Signing in user with username:", username)
    const email = `${username}@deluxeisa.app`
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("[v0] User signed in successfully:", userCredential.user.uid)

    if (!userCredential.user.displayName) {
      await updateProfile(userCredential.user, {
        displayName: username,
      })
    }

    await ensureUserDocument(userCredential.user.uid, {
      username,
      displayName: username,
      bio: "",
      avatar: getRandomAvatar(),
      email,
      createdAt: new Date(),
    })

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error("[v0] Error signing in:", error)
    return { user: null, error: "Usuário ou senha incorretos" }
  }
}

// Sign out user
export const signOutUser = async (): Promise<{ error: string | null }> => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    console.error("Error signing out:", error)
    return { error: "Erro ao sair da conta" }
  }
}
