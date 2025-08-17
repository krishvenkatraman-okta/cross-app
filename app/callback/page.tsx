"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const errorParam = searchParams.get("error")

        console.log("[v0] Processing OAuth callback...")

        if (errorParam) {
          console.error("[v0] OAuth error:", errorParam)
          setError(`Authentication failed: ${errorParam}`)
          return
        }

        if (!code) {
          console.error("[v0] No authorization code received")
          setError("No authorization code received")
          return
        }

        console.log("[v0] Storing authorization code for auth provider processing")

        // Store the authorization code and state for the auth provider to process
        localStorage.setItem("okta_auth_code", code)
        if (state) {
          localStorage.setItem("okta_auth_state", state)
        }

        const redirectPath = state === "jarvis" ? "/jarvis" : state === "inventory" ? "/inventory" : "/"
        console.log("[v0] Redirecting to:", redirectPath)
        router.push(redirectPath)
      } catch (err) {
        console.error("[v0] Callback processing error:", err)
        setError(err instanceof Error ? err.message : "Authentication failed")
      }
    }

    processCallback()
  }, [searchParams, router])

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
