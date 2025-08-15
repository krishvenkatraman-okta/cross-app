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
          throw new Error("Failed to process authentication")
        }

        const { user, tokens } = await response.json()

        // Set user in auth context
        setUser(user)

        if (tokens) {
          localStorage.setItem("okta_tokens", JSON.stringify(tokens))
          localStorage.setItem("okta_access_token", tokens.access_token)
        }

        let redirectPath = "/"
        if (state === "agent0" || state === "admin") {
          redirectPath = "/agent0"
        } else if (state === "todo0" || state === "todo") {
          redirectPath = "/todo0"
        }

        router.push(redirectPath)
      } catch (err) {
        console.error("Callback processing error:", err)
        setError("Failed to complete authentication")
      }
    }

    processCallback()
  }, [searchParams, router, setUser])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-4">Processing Authentication...</h1>
        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  )
}
