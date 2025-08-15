"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name: string
  groups: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (appType?: string) => Promise<void>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check for existing session
      const token = localStorage.getItem("okta_access_token")
      if (token) {
        await validateToken(token)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth/validate", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem("okta_access_token")
      }
    } catch (error) {
      console.error("Token validation failed:", error)
      localStorage.removeItem("okta_access_token")
    }
  }

  const signIn = async (appType?: string) => {
    let detectedAppType = appType

    if (!detectedAppType) {
      const currentPath = window.location.pathname
      if (currentPath.includes("/todo0")) {
        detectedAppType = "todo0"
      } else if (currentPath.includes("/jarvis")) {
        detectedAppType = "jarvis"
      } else if (currentPath.includes("/agent0")) {
        detectedAppType = "agent0"
      } else if (currentPath.includes("/admin") || currentPath.includes("/users")) {
        detectedAppType = "agent0"
      } else {
        detectedAppType = "todo0" // default to todo0
      }
    }

    const isJarvisApp = detectedAppType === "jarvis"
    const isAgent0App = detectedAppType === "agent0" || isJarvisApp
    const isTodo0App = detectedAppType === "todo0"

    const clientId = isJarvisApp
      ? process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID
      : isAgent0App
        ? process.env.NEXT_PUBLIC_OKTA_AGENT0_CLIENT_ID
        : process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID

    const state = isJarvisApp ? "jarvis" : isAgent0App ? "agent0" : "todo0"

    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    const redirectUri = `${window.location.origin}/callback`

    if (!clientId || !issuer) {
      console.error("Missing Okta configuration")
      return
    }

    const nonce = Math.random().toString(36).substring(2, 15)

    localStorage.setItem("okta_state", state)
    localStorage.setItem("okta_nonce", nonce)

    const authUrl = new URL(`${issuer}/oauth2/v1/authorize`)
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", "openid profile email")
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("nonce", nonce)

    console.log("[v0] Starting OAuth with:", { clientId, state, redirectUri })
    window.location.href = authUrl.toString()
  }

  const signOut = async () => {
    localStorage.removeItem("okta_access_token")
    localStorage.removeItem("okta_state")
    localStorage.removeItem("okta_nonce")
    setUser(null)

    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    if (issuer) {
      const logoutUrl = `${issuer}/oauth2/v1/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`
      window.location.href = logoutUrl
    }
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    return user.groups.includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        hasPermission,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
