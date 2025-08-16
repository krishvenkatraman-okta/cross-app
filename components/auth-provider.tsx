"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce"

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
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get("code")
      const state = urlParams.get("state")
      const codeVerifier = localStorage.getItem("pkce_code_verifier")

      if (!code || !codeVerifier) {
        throw new Error("Missing authorization code or code verifier")
      }

      console.log("[v0] Exchanging authorization code for tokens")

      const authServer = process.env.NEXT_PUBLIC_OKTA_AUTH_SERVER || "https://fcxdemo.okta.com/oauth2/v1"
      const clientId = process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID

      const tokenResponse = await fetch(`${authServer}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId!,
          code,
          redirect_uri: `${window.location.origin}/callback`,
          code_verifier: codeVerifier,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${errorText}`)
      }

      const tokens = await tokenResponse.json()

      localStorage.setItem("okta_tokens", JSON.stringify(tokens))
      localStorage.removeItem("pkce_code_verifier")

      if (tokens.id_token) {
        const payload = JSON.parse(atob(tokens.id_token.split(".")[1]))
        const userData = {
          id: payload.sub,
          email: payload.email || payload.preferred_username,
          name: payload.name || `${payload.given_name || ""} ${payload.family_name || ""}`.trim() || payload.email,
          groups: payload.groups || ["user"],
        }

        setUser(userData)
        console.log("[v0] Authentication successful, user set:", userData.email)

        const redirectPath = state === "jarvis" ? "/jarvis" : state === "inventory" ? "/inventory" : "/"
        window.location.href = redirectPath
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

      const authServer = process.env.NEXT_PUBLIC_OKTA_AUTH_SERVER || "https://fcxdemo.okta.com/oauth2/v1"
      const clientId = process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID

      if (!clientId) {
        throw new Error("Missing client ID")
      }

      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      localStorage.setItem("pkce_code_verifier", codeVerifier)

      const authUrl = new URL(`${authServer}/authorize`)
      authUrl.searchParams.set("client_id", clientId)
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("scope", "openid profile email")
      authUrl.searchParams.set("redirect_uri", `${window.location.origin}/callback`)
      authUrl.searchParams.set("state", detectedAppType)
      authUrl.searchParams.set("code_challenge", codeChallenge)
      authUrl.searchParams.set("code_challenge_method", "S256")

      console.log("[v0] Redirecting to Okta for authentication")
      window.location.href = authUrl.toString()
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

      const authServer = process.env.NEXT_PUBLIC_OKTA_AUTH_SERVER || "https://fcxdemo.okta.com/oauth2/v1"
      const baseDomain = authServer.replace("/oauth2/v1", "")
      const logoutUrl = `${baseDomain}/login/signout?fromURI=${encodeURIComponent(window.location.origin)}`
      window.location.href = logoutUrl
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
