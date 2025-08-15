"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react"

interface TokenInfo {
  access_token: string
  refresh_token?: string
  id_token?: string
  token_type: string
  expires_in: number
  scope: string
}

export default function TokensPage() {
  const { user, signIn, isLoading } = useAuth()
  const [tokens, setTokens] = useState<TokenInfo | null>(null)
  const [showTokens, setShowTokens] = useState(false)
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)

  useEffect(() => {
    if (user) {
      loadTokens()
    }
  }, [user])

  const loadTokens = async () => {
    setIsLoadingTokens(true)
    try {
      // Get tokens from localStorage (in production, this would be more secure)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold">
              T
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Token Viewer</h1>
          <p className="text-gray-600 mb-8">Please sign in with Okta to view your tokens</p>
          <Button onClick={() => signIn()} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3">
            Sign in with Okta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OAuth Tokens</h1>
              <p className="text-gray-600 mt-2">View and manage your authentication tokens</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowTokens(!showTokens)} variant="outline" className="flex items-center gap-2">
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showTokens ? "Hide" : "Show"} Tokens
              </Button>
              <Button onClick={loadTokens} disabled={isLoadingTokens} className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isLoadingTokens ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {isLoadingTokens ? (
            <div className="text-center py-12 text-gray-500">Loading tokens...</div>
          ) : !tokens ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No tokens found</div>
              <p className="text-sm text-gray-400">Complete authentication to see your tokens here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Access Token */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Access Token</h3>
                  <Button
                    onClick={() => copyToClipboard(tokens.access_token)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm break-all">
                  {formatToken(tokens.access_token)}
                </div>
                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                  <span>Type: {tokens.token_type}</span>
                  <span>Expires: {tokens.expires_in}s</span>
                  <span>Scope: {tokens.scope}</span>
                </div>
              </Card>

              {/* ID Token */}
              {tokens.id_token && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">ID Token</h3>
                    <Button
                      onClick={() => copyToClipboard(tokens.id_token!)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm break-all">
                    {formatToken(tokens.id_token)}
                  </div>
                </Card>
              )}

              {/* Refresh Token */}
              {tokens.refresh_token && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Refresh Token</h3>
                    <Button
                      onClick={() => copyToClipboard(tokens.refresh_token!)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm break-all">
                    {formatToken(tokens.refresh_token)}
                  </div>
                </Card>
              )}

              {/* User Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">User ID:</span>
                    <span className="font-mono">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span>{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Groups:</span>
                    <span>{user.groups.length > 0 ? user.groups.join(", ") : "None"}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
