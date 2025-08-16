"use client"

import { useState, useRef } from "react"
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

export default function JarvisPage() {
  const { user, signIn, signOut, isLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm JARVIS, your AI assistant. I can help you manage your inventory and answer questions. Try asking me 'What's in my Texas inventory?' or 'Show me California warehouse stock'.",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const performTokenExchange = async () => {
    try {
      console.log("[v0] Starting token exchange for inventory access...")

      // Get stored ID token
      const storedTokens = localStorage.getItem("okta_tokens")
      if (!storedTokens) {
        throw new Error("No stored tokens found")
      }

      const tokens = JSON.parse(storedTokens)
      const idToken = tokens.id_token
      if (!idToken) {
        throw new Error("No ID token found")
      }

      // Extract Okta domain from ID token
      const payload = JSON.parse(atob(idToken.split(".")[1]))
      const oktaDomain = payload.iss

      console.log("[v0] Making ID-JAG token exchange request...")
      const jagResponse = await fetch(`${oktaDomain}/oauth2/v1/token`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
          audience: process.env.NEXT_PUBLIC_OKTA_AUDIENCE!,
          subject_token: idToken,
          subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
          client_id: process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID!,
        }),
      })

      if (!jagResponse.ok) {
        const error = await jagResponse.text()
        console.error("[v0] ID-JAG exchange failed:", error)
        throw new Error(`JAG token exchange failed: ${error}`)
      }

      const jagResult = await jagResponse.json()
      console.log("[v0] ID-JAG token exchange successful")

      // Exchange JAG token for inventory access token
      console.log("[v0] Making inventory token exchange request...")
      const inventoryResponse = await fetch("/api/inventory/oauth2/token", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jagResult.access_token,
        }),
      })

      if (!inventoryResponse.ok) {
        const error = await inventoryResponse.text()
        console.error("[v0] Inventory token exchange failed:", error)
        throw new Error(`Inventory token exchange failed: ${error}`)
      }

      const inventoryResult = await inventoryResponse.json()
      console.log("[v0] Inventory token exchange successful")

      return inventoryResult.access_token
    } catch (error) {
      console.error("[v0] Token exchange error:", error)
      return null
    }
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
      // Check if this is an inventory query
      const isInventoryQuery = /inventory|stock|warehouse|texas|california/i.test(userMessage.content)

      let inventoryData = null
      if (isInventoryQuery) {
        console.log("[v0] Inventory query detected, performing token exchange...")
        const inventoryToken = await performTokenExchange()

        if (inventoryToken) {
          // Make inventory API call
          const inventoryResponse = await fetch("/api/inventory", {
            headers: {
              Authorization: `Bearer ${inventoryToken}`,
              "Content-Type": "application/json",
            },
          })

          if (inventoryResponse.ok) {
            inventoryData = await inventoryResponse.json()
            console.log("[v0] Successfully retrieved inventory data")
          }
        }
      }

      // Generate AI response
      let responseContent = ""
      if (inventoryData) {
        responseContent = `Here's your inventory data:\n\n${JSON.stringify(inventoryData, null, 2)}`
      } else if (isInventoryQuery) {
        responseContent = "I'm sorry, I couldn't access the inventory data at the moment. Please try again."
      } else {
        responseContent =
          "I'm JARVIS, your AI assistant. I can help you with inventory queries. Try asking about your Texas or California warehouse stock!"
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
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

        <div className="bg-slate-800/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-10">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-200">Loading JARVIS...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
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

        <div className="bg-slate-800/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">JARVIS</h1>
          <p className="text-blue-200 mb-6">AI Assistant with Inventory Access</p>
          <Button
            onClick={() => signIn("jarvis")}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 shadow-lg shadow-blue-500/25 border-0"
          >
            Sign in with Okta
          </Button>
        </div>
      </div>
    )
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex relative overflow-hidden">
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

      <div className="flex-1 relative z-10">
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
                onClick={signOut}
                variant="outline"
                className="bg-red-600/20 border-red-500/30 text-red-200 hover:bg-red-600/30 hover:text-white hover:border-red-400/50"
              >
                Logout
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
              Signed in as {user?.email} • JARVIS can access your Atlas Beverages Inventory data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
