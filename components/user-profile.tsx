"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Shield } from "lucide-react"
import { useAuth } from "./auth-provider"

export function UserProfile() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mock user data for demo
  const mockUser = {
    id: "user_123",
    name: "John Doe",
    email: "john.doe@company.com",
    groups: ["users", "todo-users", "admin-users"],
    avatar: "/professional-headshot.png",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
            <AvatarFallback>
              {mockUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{mockUser.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {mockUser.email}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            Groups & Permissions
          </h4>
          <div className="flex flex-wrap gap-2">
            {mockUser.groups.map((group) => (
              <Badge key={group} variant="secondary">
                {group}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
