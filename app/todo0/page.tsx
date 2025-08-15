"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus } from "lucide-react"

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export default function Todo0Page() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("okta-token")
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/auth/validate", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        loadTodos()
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = () => {
    const clientId = process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID
    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    const redirectUri = `${window.location.origin}/callback`
    const state = "todo0"
    const nonce = Math.random().toString(36).substring(2, 15)

    const authUrl =
      `${issuer}/oauth2/v1/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `scope=openid profile email&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `nonce=${nonce}`

    window.location.href = authUrl
  }

  const loadTodos = async () => {
    try {
      const token = localStorage.getItem("okta-token")
      const response = await fetch("/api/todos", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const todosData = await response.json()
        setTodos(todosData)
      }
    } catch (error) {
      console.error("Failed to load todos:", error)
    }
  }

  const addTodo = async () => {
    if (!newTodo.trim()) return

    try {
      const token = localStorage.getItem("okta-token")
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newTodo }),
      })

      if (response.ok) {
        const todo = await response.json()
        setTodos([...todos, todo])
        setNewTodo("")
      }
    } catch (error) {
      console.error("Failed to add todo:", error)
    }
  }

  const toggleTodo = async (id: string) => {
    try {
      const token = localStorage.getItem("okta-token")
      const todo = todos.find((t) => t.id === id)
      if (!todo) return

      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !todo.completed }),
      })

      if (response.ok) {
        setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const token = localStorage.getItem("okta-token")
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setTodos(todos.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete todo:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <CardTitle className="text-2xl">Todo0 Application</CardTitle>
            <p className="text-gray-600">Please sign in with Okta to access your todos</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={signIn} className="w-full">
              Sign in with Okta
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Today</h1>
          <p className="text-gray-600">Welcome, {user.name}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Input
                placeholder="Your task here"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTodo()}
                className="flex-1"
              />
              <Button onClick={addTodo}>
                <Plus className="h-4 w-4 mr-2" />
                Add task
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Checkbox checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} />
                  <span className={`flex-1 ${todo.completed ? "line-through text-gray-500" : ""}`}>{todo.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {todos.length === 0 && <p className="text-center text-gray-500 py-8">No tasks yet. Add one above!</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
