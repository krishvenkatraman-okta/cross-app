"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        if (error) {
          setError(`Authentication failed: ${error}`)
          return
        }

        if (!code) {
          setError("No authorization code received")
          return
        }

        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || "Authentication failed")
          return
        }

        const { user, tokens } = await response.json()

        setUser(user)

        localStorage.setItem("okta_tokens", JSON.stringify(tokens))

        const redirectTo = state === "todo" ? "/todo" : state === "admin" ? "/admin" : "/dashboard"

        router.push(redirectTo)
      } catch (err) {
        console.error("Callback processing error:", err)
        setError("An unexpected error occurred during authentication")
      }
    }

    processCallback()
  }, [searchParams, router, setUser])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
          <p className="text-red-700 mb-4">{error}</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-4">Processing Authentication...</h1>
        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  )
}
