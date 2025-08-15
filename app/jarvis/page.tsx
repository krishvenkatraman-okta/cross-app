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

  const loadTokens = async () => {
    setIsLoadingTokens(true)
    try {
      const storedOktaTokens = localStorage.getItem("okta_tokens")
      const storedJarvisTokens = localStorage.getItem("jarvis-tokens")

      let allTokens = {
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid profile email",
      }

      // Load original Okta authentication tokens
      if (storedOktaTokens) {
        const oktaTokens = JSON.parse(storedOktaTokens)
        allTokens = { ...allTokens, ...oktaTokens }
      }

      // Merge with JARVIS-specific tokens (ID-JAG and Todo Access tokens)
      if (storedJarvisTokens) {
        const jarvisTokens = JSON.parse(storedJarvisTokens)
        allTokens = { ...allTokens, ...jarvisTokens }
      }

      console.log("[v0] JARVIS loaded tokens:", allTokens)
      setTokens(allTokens)
    } catch (error) {
      console.error("Failed to load tokens:", error)
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
            "Hello! I'm JARVIS, your AI assistant. I can help you manage your todos and answer questions. Try asking me 'What's in my todo list?' or 'Show me my tasks'.",
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

      const response = await fetch("/api/jarvis/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
        }),
      })

      console.log("[v0] JARVIS API response status:", response.status)

      if (response.ok) {
        const data = await response.json()

        console.log("[v0] JARVIS API response data:", data)

        if (data.tokens) {
          console.log("[v0] JARVIS storing tokens:", data.tokens)
          setTokens(data.tokens)
          localStorage.setItem("jarvis-tokens", JSON.stringify(data.tokens))
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">JARVIS AI Assistant</h1>
          <p className="text-gray-600 mb-8">Please sign in with Okta to access your AI assistant</p>
          <Button onClick={() => signIn("jarvis")} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3">
            Sign in with Okta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex">
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "mr-96" : ""}`}>
        <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
          <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">JARVIS</h1>
                  <p className="text-sm text-gray-500">AI Assistant with Todo Access</p>
                </div>
              </div>
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <span>{sidebarOpen ? "▶" : "◀"}</span>
                {sidebarOpen ? "Hide" : "Show"} Tokens
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-white shadow-lg overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>
                )}
                <Card
                  className={`max-w-[70%] p-4 ${
                    message.role === "user" ? "bg-blue-500 text-white ml-auto" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </Card>
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">👤</span>
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <Card className="bg-gray-100 text-gray-900 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">JARVIS is thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white rounded-b-2xl shadow-lg p-6 border-t">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about your todos or anything else..."
                className="flex-1 text-base py-3 px-4 border-gray-200 rounded-lg"
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={isGenerating}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isGenerating}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg"
              >
                ➤
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Signed in as {user?.email || "Unknown User"} • JARVIS can access your Todo data
            </p>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">OAuth Tokens</h2>
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            {isLoadingTokens ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading tokens...</p>
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
                    title="Todo Access Token"
                    token={tokens.todo_access_token}
                    type="Bearer Token"
                    usage="Todo0 API Access"
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
                <p className="text-gray-500 mb-4">No tokens available</p>
                <Button onClick={loadTokens} variant="outline" size="sm">
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
