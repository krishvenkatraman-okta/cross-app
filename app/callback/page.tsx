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
        const error = searchParams.get("error")

        console.log("[v0] Processing OAuth callback...")

        if (error) {
          console.error("[v0] OAuth error:", error)
          setError(`Authentication failed: ${error}`)
          return
        }

        if (!code) {
          console.error("[v0] No authorization code received")
          setError("No authorization code received")
          return
        }

        const clientId = process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID
        const clientSecret = process.env.OKTA_JARVIS_CLIENT_SECRET
        const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://fcxdemo.okta.com"
        const redirectUri = `${window.location.origin}/callback`

        console.log("[v0] Exchanging authorization code for tokens...")

        const tokenResponse = await fetch(`${issuer}/oauth2/v1/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId!,
            client_secret: clientSecret!,
            code: code,
            redirect_uri: redirectUri,
          }),
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error("[v0] Token exchange failed:", errorText)
          throw new Error(`Token exchange failed: ${errorText}`)
        }

        const tokens = await tokenResponse.json()
        console.log("[v0] Token exchange successful")

        localStorage.setItem("okta_tokens", JSON.stringify(tokens))
        console.log("[v0] Tokens stored in localStorage")

        const redirectPath = state === "jarvis" ? "/jarvis" : "/"
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
