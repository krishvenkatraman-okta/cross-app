"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { oktaApps, hasAppAccess } from "@/lib/okta-config"
import { ExternalLink, Shield, Users, FileText } from "lucide-react"

interface AppSwitcherProps {
  currentApp?: "todo" | "wiki"
  userGroups?: string[]
  onAppSwitch?: (app: "todo" | "wiki") => void
}

export function AppSwitcher({ currentApp = "todo", userGroups = ["AllUsers"], onAppSwitch }: AppSwitcherProps) {
  const [switching, setSwitching] = useState<string | null>(null)

  const handleAppSwitch = async (targetApp: "todo" | "wiki") => {
    if (targetApp === currentApp) return

    setSwitching(targetApp)

    try {
      // Simulate cross-app token exchange
      const response = await fetch("/api/cross-app/token-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceApp: currentApp,
          targetApp,
          accessToken: "current_token_here",
        }),
      })

      if (response.ok) {
        onAppSwitch?.(targetApp)
        // In a real app, this would redirect or update the auth context
        window.location.href = targetApp === "todo" ? "/todo" : "/wiki"
      }
    } catch (error) {
      console.error("App switch failed:", error)
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(oktaApps).map(([key, app]) => {
        const appKey = key as "todo" | "wiki"
        const hasAccess = hasAppAccess(userGroups, appKey)
        const isCurrent = appKey === currentApp
        const isLoading = switching === appKey

        return (
          <Card key={key} className={`transition-all ${isCurrent ? "ring-2 ring-blue-500" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {appKey === "todo" ? (
                    <FileText className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Users className="h-5 w-5 text-green-600" />
                  )}
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                </div>
                {isCurrent && <Badge variant="secondary">Current</Badge>}
              </div>
              <CardDescription>
                {appKey === "todo" ? "Manage your tasks and projects" : "Access knowledge base and documentation"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Client ID: {app.clientId.slice(0, 8)}...</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={hasAccess ? "default" : "destructive"} className="text-xs">
                    {hasAccess ? "Access Granted" : "Access Denied"}
                  </Badge>
                  {!isCurrent && hasAccess && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAppSwitch(appKey)}
                      disabled={isLoading}
                      className="ml-auto"
                    >
                      {isLoading ? (
                        "Switching..."
                      ) : (
                        <>
                          Switch <ExternalLink className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
