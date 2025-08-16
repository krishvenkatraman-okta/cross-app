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

        console.log("[v0] === CALLBACK PROCESSING START ===")
        console.log("[v0] URL search params:", { code: code?.substring(0, 10) + "...", state, error })
        console.log("[v0] Current localStorage before callback:", {
          okta_tokens: localStorage.getItem("okta_tokens"),
          okta_access_token: localStorage.getItem("okta_access_token"),
        })

        if (error) {
          console.error("[v0] OAuth error received:", error)
          setError(`Authentication failed: ${error}`)
          return
        }

        if (!code) {
          console.error("[v0] No authorization code received from Okta")
          setError("No authorization code received")
          return
        }

        console.log("[v0] Making callback API request...")
        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state }),
        })

        console.log("[v0] Callback API response:", response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Callback API failed:", errorText)
          throw new Error("Failed to process authentication")
        }

        const responseData = await response.json()
        console.log("[v0] Callback API success:", {
          hasUser: !!responseData.user,
          userEmail: responseData.user?.email,
          hasTokens: !!responseData.tokens,
          tokenKeys: responseData.tokens ? Object.keys(responseData.tokens) : [],
        })

        const { user, tokens } = responseData

        // Set user in auth context
        console.log("[v0] Setting user in auth context:", user?.email)
        setUser(user)

        if (tokens) {
          console.log("[v0] Storing tokens in localStorage...")
          localStorage.setItem("okta_tokens", JSON.stringify(tokens))
          localStorage.setItem("okta_access_token", tokens.access_token)

          // Verify storage immediately
          const storedTokens = localStorage.getItem("okta_tokens")
          const storedAccessToken = localStorage.getItem("okta_access_token")
          console.log("[v0] Token storage verification:", {
            storedTokens: !!storedTokens,
            storedAccessToken: !!storedAccessToken,
            tokensLength: storedTokens?.length,
            accessTokenLength: storedAccessToken?.length,
          })

          // Parse and verify token content
          try {
            const parsedTokens = JSON.parse(storedTokens || "{}")
            console.log("[v0] Parsed stored tokens:", {
              hasIdToken: !!parsedTokens.id_token,
              hasAccessToken: !!parsedTokens.access_token,
              idTokenLength: parsedTokens.id_token?.length,
              accessTokenLength: parsedTokens.access_token?.length,
            })
          } catch (e) {
            console.error("[v0] Failed to parse stored tokens:", e)
          }
        } else {
          console.error("[v0] No tokens received from callback API!")
        }

        let redirectPath = "/"
        if (state === "jarvis") {
          redirectPath = "/jarvis"
        } else if (state === "agent0" || state === "admin") {
          redirectPath = "/agent0"
        } else if (state === "inventory") {
          redirectPath = "/inventory"
        } else if (state === "todo0" || state === "todo") {
          redirectPath = "/todo0"
        }

        console.log("[v0] === CALLBACK PROCESSING END ===")
        router.push(redirectPath)
      } catch (err) {
        console.error("[v0] Callback processing error:", err)
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
