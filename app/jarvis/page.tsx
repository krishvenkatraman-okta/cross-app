"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface TokenInfo {
  access_token: string
  refresh_token?: string
  id_token?: string
  id_jag_token?: string
  todo_access_token?: string
  token_type: string
  expires_in: number
  scope: string
  success?: boolean
}

function TokenCard({ title, token, type, usage }: { title: string; token: string; type: string; usage: string }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copyToken = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  return (
    <Card className="p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-1">
          <Button onClick={toggleExpanded} variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
            {expanded ? "👁" : "👁‍🗨"}
          </Button>
          <Button onClick={copyToken} variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
            {copied ? "✓" : "📋"}
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 rounded p-3 mb-3">
        <code className="text-xs text-gray-700 break-all">{expanded ? token : `${token.substring(0, 50)}...`}</code>
      </div>

      <div className="text-xs text-gray-500">
        <p>
          <strong>Type:</strong> {type}
        </p>
        <p>
          <strong>Used for:</strong> {usage}
        </p>
      </div>
    </Card>
  )
}

export default function JarvisPage() {
  const { user, signIn, isLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [tokens, setTokens] = useState<TokenInfo | null>(null)
  const [showTokens, setShowTokens] = useState(false)
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("[v0] No authenticated user found, starting OAuth flow")
      signIn("jarvis")
    }
  }, [user, isLoading, signIn])

  const performTokenExchange = async (
    idToken: string,
  ): Promise<{ id_jag_token: string; inventory_access_token: string } | null> => {
    try {
      console.log("[v0] Client-side token exchange request")
      console.log("[v0] ID token length:", idToken.length)
      console.log("[v0] ID token starts with:", idToken.substring(0, 50) + "...")

      try {
        const tokenHeader = JSON.parse(atob(idToken.split(".")[0]))
        const tokenPayload = JSON.parse(atob(idToken.split(".")[1]))
        console.log("[v0] ID token header:", tokenHeader)
        console.log("[v0] ID token payload:", {
          iss: tokenPayload.iss,
          aud: tokenPayload.aud,
          sub: tokenPayload.sub,
          exp: tokenPayload.exp,
          iat: tokenPayload.iat,
          expired: tokenPayload.exp < Math.floor(Date.now() / 1000),
        })

        const oktaDomain = tokenPayload.iss
        console.log("[v0] Extracted Okta domain from ID token:", oktaDomain)

        const tokenEndpoint = `${oktaDomain}/oauth2/v1/token`
        console.log("[v0] Using dynamic token endpoint:", tokenEndpoint)

        console.log("[v0] Making ID-JAG token exchange request to Okta:", tokenEndpoint)
        console.log("[v0] Using client ID:", process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID)
        console.log("[v0] Using audience:", process.env.NEXT_PUBLIC_OKTA_AUDIENCE)
        console.log("[v0] Making token exchange request to match working curl format")

        const tokenExchangeResponse = await fetch(tokenEndpoint, {
          method: "POST",
          credentials: "include", // Include cookies to maintain session context
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
            requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
            audience: process.env.NEXT_PUBLIC_OKTA_AUDIENCE || "http://localhost:5001",
            subject_token: idToken,
            subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
            client_id: process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID!,
            // Note: client_secret cannot be used in browser for security
          }),
        })

        if (!tokenExchangeResponse.ok) {
          const errorText = await tokenExchangeResponse.text()
          console.error("[v0] ID-JAG exchange failed:", {
            status: tokenExchangeResponse.status,
            statusText: tokenExchangeResponse.statusText,
            body: errorText,
          })
          return null
        }

        const tokenExchangeResult = await tokenExchangeResponse.json()
        console.log("[v0] ID-JAG token exchange successful")

        const inventoryTokenResponse = await fetch("/api/inventory/oauth2/token", {
          method: "POST",
          credentials: "include", // Maintain session context
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: tokenExchangeResult.access_token,
          }),
        })

        if (!inventoryTokenResponse.ok) {
          const errorText = await inventoryTokenResponse.text()
          console.error("[v0] Inventory token exchange failed:", inventoryTokenResponse.status, errorText)
          return null
        }

        const inventoryTokenResult = await inventoryTokenResponse.json()
        console.log("[v0] Inventory token exchange successful")

        return {
          id_jag_token: tokenExchangeResult.access_token,
          inventory_access_token: inventoryTokenResult.access_token,
        }
      } catch (decodeError) {
        console.error("[v0] Failed to decode ID token:", decodeError)
        return null
      }
    } catch (error) {
      console.error("[v0] Client-side token exchange error:", error)
      return null
    }
  }

  const loadTokens = async () => {
    setIsLoadingTokens(true)
    try {
      console.log("[v0] JARVIS checking localStorage keys...")
      console.log("[v0] All localStorage keys:", Object.keys(localStorage))

      const storedOktaTokens = localStorage.getItem("okta_tokens")
      const storedJarvisTokens = localStorage.getItem("jarvis-tokens")

      console.log("[v0] okta_tokens:", storedOktaTokens)
      console.log("[v0] jarvis-tokens:", storedJarvisTokens)

      let allTokens: any = {
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid profile email",
      }

      // Load original Okta tokens from callback
      if (storedOktaTokens) {
        const oktaTokens = JSON.parse(storedOktaTokens)
        console.log("[v0] Parsed okta_tokens:", oktaTokens)
        allTokens = { ...allTokens, ...oktaTokens }
      }

      if (storedJarvisTokens) {
        const jarvisTokens = JSON.parse(storedJarvisTokens)
        console.log("[v0] Parsed jarvis-tokens:", jarvisTokens)

        // Only include tokens that were actually granted (not failed attempts)
        if (jarvisTokens.success !== false) {
          allTokens = { ...allTokens, ...jarvisTokens }
        } else {
          console.log("[v0] Skipping failed JARVIS tokens")
        }
      }

      if (!allTokens.id_jag_token || allTokens.id_jag_token.includes("demo")) {
        delete allTokens.id_jag_token
      }

      if (!allTokens.inventory_access_token || allTokens.inventory_access_token.includes("demo")) {
        delete allTokens.inventory_access_token
        delete allTokens.todo_access_token
      } else if (allTokens.inventory_access_token) {
        allTokens.todo_access_token = allTokens.inventory_access_token
      }

      console.log("[v0] JARVIS final loaded tokens:", allTokens)
      setTokens(allTokens)
    } catch (error) {
      console.error("Failed to load tokens:", error)
      setTokens(null)
    } finally {
      setIsLoadingTokens(false)
    }
  }

  useEffect(() => {
    if (user) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm JARVIS, your AI assistant. I can help you manage your inventory and answer questions. Try asking me 'What's in my Texas inventory?' or 'Show me California warehouse stock'.",
          timestamp: new Date().toISOString(),
        },
      ])
      loadTokens()
    }
  }, [user])

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsGenerating(true)

    try {
      console.log("[v0] JARVIS sending message:", userMessage.content)

      const storedOktaTokens = localStorage.getItem("okta_tokens")
      const authHeaders: any = {
        "Content-Type": "application/json",
        Cookie: document.cookie,
      }

      let crossAppTokens = null

      if (storedOktaTokens) {
        const oktaTokens = JSON.parse(storedOktaTokens)
        if (oktaTokens.id_token) {
          authHeaders.Authorization = `Bearer ${oktaTokens.id_token}`
          console.log(
            "[v0] JARVIS sending ID token in Authorization header:",
            oktaTokens.id_token.substring(0, 20) + "...",
          )

          crossAppTokens = await performTokenExchange(oktaTokens.id_token)
          if (crossAppTokens) {
            console.log("[v0] Client-side token exchange successful, sending tokens to server")
          } else {
            console.log("[v0] Client-side token exchange failed")
          }

          try {
            const tokenParts = oktaTokens.id_token.split(".")
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]))
              console.log("[v0] Frontend ID token details:", {
                issuer: payload.iss,
                audience: payload.aud,
                subject: payload.sub,
                expires: payload.exp,
                issuedAt: payload.iat,
                expired: payload.exp < Math.floor(Date.now() / 1000),
                tokenLength: oktaTokens.id_token.length,
                tokenStart: oktaTokens.id_token.substring(0, 50),
                tokenEnd: oktaTokens.id_token.substring(oktaTokens.id_token.length - 50),
              })
            }
          } catch (error) {
            console.log("[v0] Could not decode frontend ID token for debugging:", error)
          }
        }
      }

      const response = await fetch("/api/jarvis/chat", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          crossAppTokens: crossAppTokens, // Send client-side tokens to server
        }),
      })

      console.log("[v0] JARVIS API response status:", response.status)

      if (response.ok) {
        const data = await response.json()

        console.log("[v0] JARVIS API response data:", data)

        if (data.tokens && data.success !== false) {
          console.log("[v0] JARVIS storing successful tokens:", data.tokens)
          setTokens((prev) => ({ ...prev, ...data.tokens }))
          localStorage.setItem("jarvis-tokens", JSON.stringify({ ...data.tokens, success: true }))
          setTimeout(() => loadTokens(), 100)
        } else if (data.success === false) {
          console.log("[v0] JARVIS token exchange failed, not storing tokens")
          // Clear any failed token attempts
          localStorage.setItem("jarvis-tokens", JSON.stringify({ success: false }))
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || data.response || "No response received",
          timestamp: new Date().toISOString(),
        }

        console.log("[v0] JARVIS adding assistant message:", assistantMessage.content)
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorText = await response.text()
        console.error("[v0] JARVIS API error:", response.status, errorText)
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] JARVIS chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="bg-slate-800/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-10">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-200">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Large outer ring */}
        <div
          className="absolute w-[800px] h-[800px] border border-cyan-400/10 rounded-full animate-spin"
          style={{ animationDuration: "60s" }}
        >
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-0.5 h-12 ${i % 4 === 0 ? "bg-cyan-400/30" : "bg-cyan-400/10"}`}
              style={{
                top: "0px",
                left: "50%",
                transformOrigin: "50% 400px",
                transform: `translateX(-50%) rotate(${i * 11.25}deg)`,
              }}
            />
          ))}
        </div>

        {/* Medium ring */}
        <div
          className="absolute w-[600px] h-[600px] border border-blue-400/15 rounded-full animate-spin"
          style={{ animationDuration: "40s", animationDirection: "reverse" }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-8 bg-blue-400/20"
              style={{
                top: "20px",
                left: "50%",
                transformOrigin: "50% 280px",
                transform: `translateX(-50%) rotate(${i * 15}deg)`,
              }}
            />
          ))}
        </div>

        {/* Inner ring */}
        <div
          className="absolute w-[400px] h-[400px] border border-yellow-400/20 rounded-full animate-spin"
          style={{ animationDuration: "25s" }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-16 ${i % 3 === 0 ? "bg-yellow-400/40" : "bg-yellow-400/15"}`}
              style={{
                top: "10px",
                left: "50%",
                transformOrigin: "50% 190px",
                transform: `translateX(-50%) rotate(${i * 22.5}deg)`,
              }}
            />
          ))}
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-10">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-200 mb-4">Authentication required...</p>
          <Button
            onClick={() => {
              console.log("[v0] Manual sign-in button clicked")
              signIn("jarvis")
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 shadow-lg shadow-blue-500/25 border-0"
          >
            Sign in with Okta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex relative overflow-hidden">
      {/* Large outer ring */}
      <div
        className="absolute w-[800px] h-[800px] border border-cyan-400/10 rounded-full animate-spin"
        style={{ animationDuration: "60s" }}
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-0.5 h-12 ${i % 4 === 0 ? "bg-cyan-400/30" : "bg-cyan-400/10"}`}
            style={{
              top: "0px",
              left: "50%",
              transformOrigin: "50% 400px",
              transform: `translateX(-50%) rotate(${i * 11.25}deg)`,
            }}
          />
        ))}
      </div>

      {/* Medium ring */}
      <div
        className="absolute w-[600px] h-[600px] border border-blue-400/15 rounded-full animate-spin"
        style={{ animationDuration: "40s", animationDirection: "reverse" }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-8 bg-blue-400/20"
            style={{
              top: "20px",
              left: "50%",
              transformOrigin: "50% 280px",
              transform: `translateX(-50%) rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </div>

      {/* Inner ring with segments */}
      <div
        className="absolute w-[400px] h-[400px] border border-yellow-400/20 rounded-full animate-spin"
        style={{ animationDuration: "25s" }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-16 ${i % 3 === 0 ? "bg-yellow-400/40" : "bg-yellow-400/15"}`}
            style={{
              top: "10px",
              left: "50%",
              transformOrigin: "50% 190px",
              transform: `translateX(-50%) rotate(${i * 22.5}deg)`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      <div
        className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(59,130,246,0.02)_60deg,transparent_120deg)] animate-spin"
        style={{ animationDuration: "30s" }}
      ></div>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "mr-96" : ""} relative z-10`}>
        <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-blue-500/30 rounded-t-2xl shadow-lg shadow-blue-500/10 p-6 border-b border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/50">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">JARVIS</h1>
                  <p className="text-sm text-blue-200">AI Assistant with Inventory Access</p>
                </div>
              </div>
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="outline"
                className="flex items-center gap-2 bg-slate-700/50 border-blue-500/30 text-blue-200 hover:bg-slate-600/50 hover:text-white hover:border-blue-400/50"
              >
                <span>{sidebarOpen ? "▶" : "◀"}</span>
                {sidebarOpen ? "Hide" : "Show"} Tokens
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-slate-800/90 backdrop-blur-sm border-l border-r border-blue-500/30 shadow-lg overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/50">
                    <span className="text-sm">🤖</span>
                  </div>
                )}
                <Card
                  className={`max-w-[70%] p-4 border-0 shadow-lg ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-500/25"
                      : "bg-slate-700/80 backdrop-blur-sm text-blue-100 shadow-slate-900/50"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-blue-300"}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </Card>
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-sm">👤</span>
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/50">
                  <span className="text-sm">🤖</span>
                </div>
                <Card className="bg-slate-700/80 backdrop-blur-sm text-blue-100 p-4 border-0 shadow-lg shadow-slate-900/50">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-blue-300">JARVIS is thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-slate-800/90 backdrop-blur-sm border border-blue-500/30 rounded-b-2xl shadow-lg shadow-blue-500/10 p-6 border-t border-blue-500/20">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about your inventory or anything else..."
                className="flex-1 text-base py-3 px-4 bg-slate-700/50 border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:ring-blue-400/50"
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={isGenerating}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isGenerating}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-blue-500/25 border-0"
              >
                ➤
              </Button>
            </div>
            <p className="text-xs text-blue-300 mt-2 text-center">
              Signed in as {user?.email || "Unknown User"} • JARVIS can access your Atlas Beverages Inventory data
            </p>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-slate-800/95 backdrop-blur-sm shadow-2xl border-l border-blue-500/30 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">OAuth Tokens</h2>
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="sm"
                className="text-blue-300 hover:text-white hover:bg-slate-700/50"
              >
                ✕
              </Button>
            </div>

            {isLoadingTokens ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-blue-300">Loading tokens...</p>
              </div>
            ) : tokens ? (
              <div className="space-y-4">
                {tokens.access_token && (
                  <TokenCard
                    title="Access Token"
                    token={tokens.access_token}
                    type="Bearer Token"
                    usage="JARVIS Authentication"
                  />
                )}

                {tokens.id_token && (
                  <TokenCard title="ID Token" token={tokens.id_token} type="JWT Token" usage="User Identity" />
                )}

                {tokens.id_jag_token && (
                  <TokenCard
                    title="ID-JAG Token"
                    token={tokens.id_jag_token}
                    type="ID Assertion JWT"
                    usage="Cross-App Access"
                  />
                )}

                {tokens.todo_access_token && (
                  <TokenCard
                    title="Inventory Access Token"
                    token={tokens.todo_access_token}
                    type="Bearer Token"
                    usage="Atlas Beverages Inventory API Access"
                  />
                )}

                {tokens.refresh_token && (
                  <TokenCard
                    title="Refresh Token"
                    token={tokens.refresh_token}
                    type="Refresh Token"
                    usage="Token Renewal"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-blue-300 mb-4">No tokens available</p>
                <Button
                  onClick={loadTokens}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 text-blue-200 hover:bg-slate-700/50 bg-transparent"
                >
                  Refresh Tokens
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
