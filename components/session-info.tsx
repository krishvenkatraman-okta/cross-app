"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SessionInfo() {
  // Mock session data
  const sessionData = {
    loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    tokenType: "Bearer",
    scopes: ["openid", "profile", "email", "groups"],
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getTimeUntilExpiry = () => {
    const now = new Date()
    const diff = sessionData.expiresAt.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-2" />
          Session Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Login Time:</span>
            <span>{formatTime(sessionData.loginTime)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Expires:</span>
            <span>{formatTime(sessionData.expiresAt)}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted-foreground">Time Left:</span>
            <Badge variant="outline">{getTimeUntilExpiry()}</Badge>
          </div>
        </div>

        <div className="text-sm">
          <p className="text-muted-foreground mb-2">Active Scopes:</p>
          <div className="flex flex-wrap gap-1">
            {sessionData.scopes.map((scope) => (
              <Badge key={scope} variant="secondary" className="text-xs">
                {scope}
              </Badge>
            ))}
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full bg-transparent">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Token
        </Button>
      </CardContent>
    </Card>
  )
}
