"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Key, Copy, RefreshCw, Eye, EyeOff } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface CrossAppToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  app: string
  exchanged_from: string
}

export function CrossAppTokenDisplay() {
  const [token, setToken] = useState<CrossAppToken | null>(null)
  const [loading, setLoading] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const requestCrossAppToken = async (sourceApp: string, targetApp: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/cross-app/token-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceApp,
          targetApp,
          accessToken: "current_user_token", // In real app, get from auth context
        }),
      })

      const data = await response.json()
      if (data.success) {
        setToken(data.token)
      }
    } catch (error) {
      console.error("Token request failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token.access_token)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2 text-amber-600" />
          Cross-App Access Token
        </CardTitle>
        <CardDescription>Request and view cross-app access tokens for secure resource sharing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => requestCrossAppToken("admin", "todo")} disabled={loading} size="sm">
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Request Todo Access Token
          </Button>
          <Button onClick={() => requestCrossAppToken("admin", "wiki")} disabled={loading} variant="outline" size="sm">
            Request Wiki Access Token
          </Button>
        </div>

        {token && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Active Cross-App Token</h4>
              <div className="flex gap-2">
                <Badge variant="secondary">{token.app}</Badge>
                <Badge variant="outline">Expires in {token.expires_in}s</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Access Token:</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setShowToken(!showToken)}>
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={copyToken}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                value={showToken ? token.access_token : "•".repeat(40)}
                readOnly
                className="font-mono text-xs"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Token Type:</span> {token.token_type}
              </div>
              <div>
                <span className="font-medium">Scope:</span> {token.scope}
              </div>
              <div>
                <span className="font-medium">Source App:</span> {token.exchanged_from}
              </div>
              <div>
                <span className="font-medium">Target App:</span> {token.app}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
