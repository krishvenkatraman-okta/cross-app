"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface OktaAuth {
  signInWithRedirect: (options?: any) => Promise<void>
  handleLoginRedirect: () => Promise<void>
  getUser: () => Promise<any>
  getAccessToken: () => string | undefined
  getIdToken: () => string | undefined
  isAuthenticated: () => Promise<boolean>
  signOut: () => Promise<void>
  tokenManager: {
    get: (key: string) => Promise<any>
    on: (event: string, callback: Function) => void
  }
}

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

let oktaAuth: OktaAuth | null = null
let initPromise: Promise<OktaAuth | null> | null = null

const initializeOktaAuth = async (appType = "jarvis"): Promise<OktaAuth | null> => {
  if (typeof window === "undefined") return null

  if (initPromise) return initPromise

  if (oktaAuth) return oktaAuth

  initPromise = (async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID
      const authServer = process.env.NEXT_PUBLIC_OKTA_AUTH_SERVER || "https://fcxdemo.okta.com/oauth2/v1"
      const issuer = authServer.replace("/oauth2/v1", "")

      if (!clientId || !issuer) {
        console.error("[v0] Missing Okta configuration for", appType)
        return null
      }

      const { OktaAuth } = await import("@okta/okta-auth-js")

      oktaAuth = new OktaAuth({
        issuer,
        clientId,
        redirectUri: `${window.location.origin}/callback`,
        scopes: ["openid", "profile", "email"],
        pkce: true,
        responseType: "code",
        state: appType,
      })

      console.log("[v0] Okta Auth initialized for", appType, "with PKCE enabled")
      return oktaAuth
    } catch (error) {
      console.error("[v0] Failed to initialize Okta Auth:", error)
      return null
    }
  })()

  return initPromise
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log("[v0] === AUTH STATUS CHECK START ===")

      if (window.location.pathname === "/callback") {
        console.log("[v0] In callback, handling login redirect")
        await handleCallback()
        return
      }

      const tokensJson = localStorage.getItem("okta_tokens")
      if (tokensJson) {
        try {
          const tokens = JSON.parse(tokensJson)
          if (tokens.id_token) {
            const payload = JSON.parse(atob(tokens.id_token.split(".")[1]))
            const userData = {
              id: payload.sub,
              email: payload.email || payload.preferred_username,
              name: payload.name || `${payload.given_name || ""} ${payload.family_name || ""}`.trim() || payload.email,
              groups: payload.groups || ["user"],
            }
            setUser(userData)
            console.log("[v0] User restored from stored tokens:", userData.email)
          }
        } catch (e) {
          console.error("[v0] Failed to parse stored tokens:", e)
          localStorage.removeItem("okta_tokens")
        }
      }

      console.log("[v0] === AUTH STATUS CHECK END ===")
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCallback = async () => {
    try {
      const auth = await initializeOktaAuth("jarvis")

      if (auth) {
        console.log("[v0] Handling login redirect with okta-auth-js")
        await auth.handleLoginRedirect()

        const isAuthenticated = await auth.isAuthenticated()
        if (isAuthenticated) {
          const userInfo = await auth.getUser()
          const idToken = auth.getIdToken()
          const accessToken = auth.getAccessToken()

          const tokens = {
            id_token: idToken,
            access_token: accessToken,
            token_type: "Bearer",
          }
          localStorage.setItem("okta_tokens", JSON.stringify(tokens))

          const userData = {
            id: userInfo.sub,
            email: userInfo.email || userInfo.preferred_username,
            name:
              userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || userInfo.email,
            groups: userInfo.groups || ["user"],
          }

          setUser(userData)
          console.log("[v0] Authentication successful, user set:", userData.email)

          const state = new URLSearchParams(window.location.search).get("state")
          const redirectPath = state === "jarvis" ? "/jarvis" : state === "inventory" ? "/inventory" : "/"
          window.location.href = redirectPath
        }
      }
    } catch (error) {
      console.error("[v0] Callback handling failed:", error)
      window.location.href = "/?error=auth_failed"
    }
  }

  const signIn = async (appType?: string) => {
    try {
      let detectedAppType = appType
      if (!detectedAppType) {
        const currentPath = window.location.pathname
        if (currentPath.includes("/jarvis")) {
          detectedAppType = "jarvis"
        } else if (currentPath.includes("/inventory")) {
          detectedAppType = "inventory"
        } else {
          detectedAppType = "jarvis"
        }
      }

      console.log("[v0] Starting sign in for app type:", detectedAppType)

      const auth = await initializeOktaAuth(detectedAppType)
      if (!auth) {
        console.error("[v0] Failed to initialize Okta Auth")
        return
      }

      await auth.signInWithRedirect({
        state: detectedAppType,
      })
    } catch (error) {
      console.error("[v0] Sign in failed:", error)
    }
  }

  const signOut = async () => {
    try {
      localStorage.removeItem("okta_access_token")
      localStorage.removeItem("okta_tokens")
      localStorage.removeItem("okta_state")
      localStorage.removeItem("okta_nonce")
      localStorage.removeItem("jarvis-tokens")
      localStorage.removeItem("pkce_code_verifier")
      setUser(null)

      console.log("[v0] Logout: Cleared all tokens and user state")

      if (oktaAuth) {
        await oktaAuth.signOut()
      } else {
        const authServer = process.env.NEXT_PUBLIC_OKTA_AUTH_SERVER || "https://fcxdemo.okta.com/oauth2/v1"
        const baseDomain = authServer.replace("/oauth2/v1", "")
        const logoutUrl = `${baseDomain}/login/signout?fromURI=${encodeURIComponent(window.location.origin)}`
        window.location.href = logoutUrl
      }
    } catch (error) {
      console.error("[v0] Sign out failed:", error)
      window.location.href = "/"
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
