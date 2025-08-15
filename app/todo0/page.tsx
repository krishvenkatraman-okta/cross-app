"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from "lucide-react"

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export default function Todo0Page() {
  const { user, signIn, isLoading } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [isLoadingTodos, setIsLoadingTodos] = useState(false)

  useEffect(() => {
    if (user) {
      loadTodos()
    }
  }, [user])

  const loadTodos = async () => {
    setIsLoadingTodos(true)
    try {
      const response = await fetch("/api/todo0/todos")
      if (response.ok) {
        const data = await response.json()
        setTodos(data.todos || [])
      }
    } catch (error) {
      console.error("Failed to load todos:", error)
    } finally {
      setIsLoadingTodos(false)
    }
  }

  const addTodo = async () => {
    if (!newTodo.trim()) return

    try {
      const response = await fetch("/api/todo0/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodo.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setTodos((prev) => [...prev, data.todo])
        setNewTodo("")
      }
    } catch (error) {
      console.error("Failed to add todo:", error)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todo0/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      })

      if (response.ok) {
        setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed } : todo)))
      }
    } catch (error) {
      console.error("Failed to update todo:", error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todo0/todos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete todo:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Todo0 Application</h1>
          <p className="text-gray-600 mb-8">Please sign in with Okta to access your todos</p>
          <Button onClick={() => signIn("todo0")} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3">
            Sign in with Okta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Today</h1>

          {/* Add new todo */}
          <div className="flex gap-3 mb-8">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Your task here"
              className="flex-1 text-lg py-3 px-4 border-gray-200 rounded-lg"
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
            />
            <Button onClick={addTodo} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
              Add task
            </Button>
          </div>

          {/* Todo list */}
          <div className="space-y-3">
            {isLoadingTodos ? (
              <div className="text-center py-8 text-gray-500">Loading todos...</div>
            ) : todos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No todos yet. Add one above!</div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    todo.completed ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={(checked) => toggleTodo(todo.id, !!checked)}
                    className="w-5 h-5"
                  />
                  <span className={`flex-1 text-lg ${todo.completed ? "text-blue-600 line-through" : "text-gray-900"}`}>
                    {todo.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* User info */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            Signed in as {user.email}
          </div>
        </div>
      </div>
    </div>
  )
}
