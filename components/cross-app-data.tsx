"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckSquare, Users, RefreshCw, ExternalLink, AlertCircle } from "lucide-react"
import Link from "next/link"
import { crossAppClient } from "@/lib/cross-app-client"

interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: string
  dueDate: string
  createdBy: string
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  status: string
  groups: string[]
  lastLogin: string
  todoCount: number
}

export function CrossAppData() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasPermissions, setHasPermissions] = useState({ todos: false, users: false })

  useEffect(() => {
    checkPermissions()
    loadData()
  }, [])

  const checkPermissions = async () => {
    try {
      const [todoPermission, userPermission] = await Promise.all([
        crossAppClient.checkPermission("todo:read"),
        crossAppClient.checkPermission("users:read"),
      ])

      setHasPermissions({
        todos: todoPermission,
        users: userPermission,
      })
    } catch (err) {
      console.error("Permission check failed:", err)
    }
  }

  const loadData = async () => {
    try {
      setError(null)
      const [todoResponse, userResponse] = await Promise.all([
        crossAppClient.getTodos().catch(() => ({ todos: [] })),
        crossAppClient.getUsers().catch(() => ({ users: [] })),
      ])

      setTodos(todoResponse.todos || [])
      setUsers(userResponse.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
      case "inactive":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div>
            <p className="font-medium text-sm text-red-800">Cross-App Access Error</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Live data from other applications via secure cross-app API</p>
        <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="todos" className="flex items-center">
            <CheckSquare className="h-4 w-4 mr-2" />
            Todo Data ({todos.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            User Data ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-3">
          {!hasPermissions.todos ? (
            <Card className="p-4 border-yellow-200 bg-yellow-50">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">Insufficient permissions to access todo data</p>
              </div>
            </Card>
          ) : todos.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No todo data available</p>
            </Card>
          ) : (
            todos.map((todo) => (
              <Card key={todo.id} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{todo.title}</h4>
                    <div className="flex space-x-1">
                      <Badge className={`text-xs ${getPriorityColor(todo.priority)}`}>{todo.priority}</Badge>
                      <Badge className={`text-xs ${getStatusColor(todo.completed ? "completed" : "pending")}`}>
                        {todo.completed ? "completed" : "pending"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{todo.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{todo.createdBy}</span>
                    <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
          <div className="pt-2">
            <Link href="/todo">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Todo App
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-3">
          {!hasPermissions.users ? (
            <Card className="p-4 border-yellow-200 bg-yellow-50">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">Insufficient permissions to access user data</p>
              </div>
            </Card>
          ) : users.length === 0 ? (
            <Card className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No user data available</p>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{user.name}</span>
                    <Badge className={`text-xs ${getStatusColor(user.status)}`}>{user.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{user.todoCount} todos</span>
                    <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.groups.slice(0, 2).map((group) => (
                      <Badge key={group} variant="outline" className="text-xs">
                        {group}
                      </Badge>
                    ))}
                    {user.groups.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.groups.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
