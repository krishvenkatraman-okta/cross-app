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
    // Function to load tokens
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
    </div>
  )
}
</merged_code>
