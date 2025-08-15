"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, Eye, EyeOff, Copy, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"

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
  todo_access_token?: string // Renamed from cross_app_access_token to todo_access_token
  token_type: string
  expires_in: number
  scope: string
}

export default function Agent0Page() {
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
    if (user) {
      // Add welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm Agent0, your AI assistant. I can help you manage your todos and answer questions. Try asking me 'What's in my todo list?' or 'Show me my tasks'.",
          timestamp: new Date().toISOString(),
        },
      ])
      loadTokens()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadTokens = async () => {
    setIsLoadingTokens(true)
    try {
      const storedTokens = localStorage.getItem("okta_tokens")
      if (storedTokens) {
        setTokens(JSON.parse(storedTokens))
      }
    } catch (error) {
      console.error("Failed to load tokens:", error)
    } finally {
      setIsLoadingTokens(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatToken = (token: string) => {
    if (!showTokens) {
      return "•".repeat(20) + token.slice(-10)
    }
    return token
  }

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
      const response = await fetch("/api/agent0/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie, // Pass cookies to enable real user token retrieval
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      if (data.tokens) {
        const currentTokens = JSON.parse(localStorage.getItem("okta_tokens") || "{}")
        const updatedTokens = {
          ...currentTokens,
          id_jag_token: data.tokens.id_jag_token,
          todo_access_token: data.tokens.todo_access_token,
        }
        localStorage.setItem("okta_tokens", JSON.stringify(updatedTokens))
        setTokens(updatedTokens)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent0 AI Assistant</h1>
          <p className="text-gray-600 mb-8">Please sign in with Okta to access your AI assistant</p>
          <Button onClick={() => signIn("agent0")} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3">
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
          {/* Header */}
          <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Agent0</h1>
                  <p className="text-sm text-gray-500">AI Assistant with Todo Access</p>
                </div>
              </div>
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {sidebarOpen ? "Hide" : "Show"} Tokens
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 bg-white shadow-lg overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-600" />
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
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
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
                    <span className="text-sm text-gray-500">Agent0 is thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Signed in as {user?.email || "Unknown User"} • Agent0 can access your Todo0 data
            </p>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">OAuth Tokens</h2>
                <p className="text-sm text-gray-500">Current authentication tokens</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowTokens(!showTokens)}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700"
                >
                  {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={loadTokens}
                  disabled={isLoadingTokens}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingTokens ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {isLoadingTokens ? (
              <div className="text-center py-8 text-gray-500">Loading tokens...</div>
            ) : !tokens ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">No tokens found</div>
                <p className="text-xs text-gray-400">Complete authentication to see tokens</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Access Token */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Access Token</h3>
                    <Button
                      onClick={() => copyToClipboard(tokens.access_token)}
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 hover:text-purple-700 p-1"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded p-3 font-mono text-xs break-all">
                    {formatToken(tokens.access_token)}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <div>Type: {tokens.token_type}</div>
                    <div>Expires: {tokens.expires_in}s</div>
                    <div>Scope: {tokens.scope}</div>
                  </div>
                </Card>

                {/* ID Token */}
                {tokens.id_token && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">ID Token</h3>
                      <Button
                        onClick={() => copyToClipboard(tokens.id_token!)}
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 p-1"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 font-mono text-xs break-all">
                      {formatToken(tokens.id_token)}
                    </div>
                  </Card>
                )}

                {/* ID-JAG Token */}
                {tokens.id_jag_token && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">ID-JAG Token</h3>
                      <Button
                        onClick={() => copyToClipboard(tokens.id_jag_token!)}
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 p-1"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 font-mono text-xs break-all">
                      {formatToken(tokens.id_jag_token)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div>Type: ID Assertion JWT</div>
                      <div>Used for: Cross-App Access</div>
                    </div>
                  </Card>
                )}

                {/* Todo Access Token */}
                {tokens.todo_access_token && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Todo Access Token</h3>
                      <Button
                        onClick={() => copyToClipboard(tokens.todo_access_token!)}
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 p-1"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 font-mono text-xs break-all">
                      {formatToken(tokens.todo_access_token)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div>Type: Bearer Token</div>
                      <div>Access: Todo0 Resources</div>
                    </div>
                  </Card>
                )}

                {/* Refresh Token */}
                {tokens.refresh_token && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Refresh Token</h3>
                      <Button
                        onClick={() => copyToClipboard(tokens.refresh_token!)}
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 p-1"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 font-mono text-xs break-all">
                      {formatToken(tokens.refresh_token)}
                    </div>
                  </Card>
                )}

                {/* User Info */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">User Information</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">User ID:</span>
                      <span className="font-mono text-right">{user?.id || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-right">{user?.email || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="text-right">{user?.name || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Groups:</span>
                      <span className="text-right">{user?.groups?.length > 0 ? user.groups.join(", ") : "None"}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
