import { create } from "zustand"
import { authClient } from "@/lib/auth-client"

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  checkSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  checkSession: async () => {
    set({ isLoading: true })
    if (process.env.NODE_ENV === "development") {
      set({ user: { id: "dev", email: "dev@local", name: "Dev User" }, isLoading: false })
      return
    }
    try {
      const session = await authClient.getSession()
      const user = session?.data?.user
      set({ user: user ? (user as AuthUser) : null })
    } catch {
      set({ user: null })
    } finally {
      set({ isLoading: false })
    }
  },

  signIn: async (email, password) => {
    const result = await authClient.signIn.email({ email, password })
    if (result.error) throw new Error(result.error.message ?? "Sign in failed")
    set({ user: result.data?.user ? (result.data.user as AuthUser) : null })
  },

  signUp: async (email, password, name) => {
    const result = await authClient.signUp.email({ email, password, name })
    if (result.error) throw new Error(result.error.message ?? "Sign up failed")
    set({ user: result.data?.user ? (result.data.user as AuthUser) : null })
  },

  signOut: async () => {
    await authClient.signOut()
    set({ user: null })
  },
}))
