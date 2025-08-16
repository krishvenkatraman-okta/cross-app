"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getAuthServerUrls } from "@/lib/okta-config"

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
      console.log("[v0] === AUTH STATUS CHECK START ===")
      console.log("[v0] All localStorage keys:", Object.keys(localStorage))
      console.log("[v0] localStorage contents:", {
        okta_tokens: localStorage.getItem("okta_tokens"),
        okta_access_token: localStorage.getItem("okta_access_token"),
        jarvis_tokens: localStorage.getItem("jarvis-tokens"),
      })

      const tokensJson = localStorage.getItem("okta_tokens")
      let token = null

      if (tokensJson) {
        try {
          const tokens = JSON.parse(tokensJson)
          token = tokens.access_token || tokens.id_token
          console.log("[v0] Found tokens in okta_tokens:", {
            hasAccessToken: !!tokens.access_token,
            hasIdToken: !!tokens.id_token,
            tokenType: tokens.token_type,
            selectedToken: token ? "present" : "missing",
          })
        } catch (e) {
          console.error("[v0] Failed to parse stored tokens:", e)
        }
      } else {
        console.log("[v0] No okta_tokens found in localStorage")
      }

      if (!token) {
        token = localStorage.getItem("okta_access_token")
        console.log("[v0] Fallback to okta_access_token:", token ? "present" : "missing")
      }

      if (token) {
        console.log("[v0] Token found, proceeding with validation")
        await validateToken(token)
      } else {
        console.log("[v0] No valid tokens found, user needs to login")
      }
      console.log("[v0] === AUTH STATUS CHECK END ===")
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateToken = async (token: string) => {
    try {
      console.log("[v0] Token found, extracting user info from stored tokens")

      const tokensJson = localStorage.getItem("okta_tokens")
      if (tokensJson) {
        try {
          const tokens = JSON.parse(tokensJson)
          if (tokens.id_token) {
            // Decode ID token to get user info (simple base64 decode, no verification needed for demo)
            const payload = JSON.parse(atob(tokens.id_token.split(".")[1]))
            const userData = {
              id: payload.sub,
              email: payload.email || payload.preferred_username,
              name: payload.name || payload.given_name + " " + payload.family_name || payload.email,
              groups: payload.groups || ["user"],
            }
            setUser(userData)
            console.log("[v0] User set from stored ID token:", userData.email)
            return
          }
        } catch (e) {
          console.error("[v0] Failed to decode ID token:", e)
        }
      }

      console.log("[v0] No valid ID token found, user remains null")
      setUser(null)
    } catch (error) {
      console.error("Token processing failed:", error)
      setUser(null)
    }
  }

  const signIn = async (appType?: string) => {
    let detectedAppType = appType

    if (!detectedAppType) {
      const currentPath = window.location.pathname
      if (currentPath.includes("/inventory")) {
        detectedAppType = "inventory"
      } else if (currentPath.includes("/todo0")) {
        detectedAppType = "todo0"
      } else if (currentPath.includes("/jarvis")) {
        detectedAppType = "jarvis"
      } else if (currentPath.includes("/agent0")) {
        detectedAppType = "agent0"
      } else if (currentPath.includes("/admin") || currentPath.includes("/users")) {
        detectedAppType = "agent0"
      } else {
        detectedAppType = "inventory"
      }
    }

    const isJarvisApp = detectedAppType === "jarvis"
    const isAgent0App = detectedAppType === "agent0" || isJarvisApp
    const isInventoryApp = detectedAppType === "inventory"
    const isTodo0App = detectedAppType === "todo0"

    const clientId = isJarvisApp
      ? process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID
      : isAgent0App
        ? process.env.NEXT_PUBLIC_OKTA_AGENT0_CLIENT_ID
        : isInventoryApp
          ? process.env.NEXT_PUBLIC_OKTA_INVENTORY_CLIENT_ID || process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID // Fallback to JARVIS
          : process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID

    const state = isJarvisApp ? "jarvis" : isAgent0App ? "agent0" : isInventoryApp ? "inventory" : "todo0"

    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    const redirectUri = `${window.location.origin}/callback`

    if (!clientId || !issuer) {
      console.error("Missing Okta configuration", {
        clientId: clientId ? "present" : "missing",
        issuer: issuer ? "present" : "missing",
        appType: detectedAppType,
        availableEnvVars: {
          jarvis: process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID ? "present" : "missing",
          inventory: process.env.NEXT_PUBLIC_OKTA_INVENTORY_CLIENT_ID ? "present" : "missing",
        },
      })
      return
    }

    const nonce = Math.random().toString(36).substring(2, 15)

    localStorage.setItem("okta_state", state)
    localStorage.setItem("okta_nonce", nonce)

    const authServerUrls = getAuthServerUrls(issuer)
    const authUrl = new URL(authServerUrls.authorize)
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
    localStorage.removeItem("okta_tokens")
    localStorage.removeItem("okta_state")
    localStorage.removeItem("okta_nonce")
    localStorage.removeItem("jarvis-tokens")
    setUser(null)

    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    if (issuer) {
      const authServerUrls = getAuthServerUrls(issuer)
      const logoutUrl = `${authServerUrls.logout}?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`
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
