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
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize Okta auth here
    // For now, simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const signIn = async () => {
    // Implement Okta sign in
    console.log("Sign in with Okta")
  }

  const signOut = async () => {
    // Implement Okta sign out
    setUser(null)
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    // Check user groups/permissions
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
