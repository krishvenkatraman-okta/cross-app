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
  signIn: () => Promise<void>
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
      // Check for existing session only
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

  const signIn = async () => {
    const clientId = process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID
    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    const redirectUri = `${window.location.origin}/callback`

    if (!clientId || !issuer) {
      console.error("Missing Okta configuration")
      return
    }

    const state = Math.random().toString(36).substring(2, 15)
    const nonce = Math.random().toString(36).substring(2, 15)

    localStorage.setItem("okta_state", state)
    localStorage.setItem("okta_nonce", nonce)

    const authUrl = new URL(`${issuer}/oauth2/default/v1/authorize`)
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", "openid profile email")
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("nonce", nonce)

    window.location.href = authUrl.toString()
  }

  const signOut = async () => {
    localStorage.removeItem("okta_access_token")
    localStorage.removeItem("okta_state")
    localStorage.removeItem("okta_nonce")
    setUser(null)

    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    if (issuer) {
      const logoutUrl = `${issuer}/oauth2/default/v1/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`
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
