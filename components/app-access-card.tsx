import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Lock, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import type React from "react"

interface AppAccessCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  permissions: string[]
  status: "active" | "restricted" | "pending"
}

export function AppAccessCard({ icon, title, description, href, permissions, status }: AppAccessCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "restricted":
        return <Lock className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200"
      case "restricted":
        return "bg-red-50 text-red-700 border-red-200"
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">{icon}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">{title}</h3>
                <div
                  className={`px-2 py-1 rounded-full text-xs border flex items-center space-x-1 ${getStatusColor()}`}
                >
                  {getStatusIcon()}
                  <span className="capitalize">{status}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="ml-4">
            {status === "active" ? (
              <Link href={href}>
                <Button size="sm">
                  Access <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="outline" disabled>
                {status === "restricted" ? "Restricted" : "Pending"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
