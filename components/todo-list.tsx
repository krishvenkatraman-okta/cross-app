"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Save, X, Calendar, User, CheckSquare } from "lucide-react"

interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: "low" | "medium" | "high"
  dueDate: string
  createdBy: string
  createdAt: string
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: "1",
      title: "Review cross-app access implementation",
      description: "Ensure proper authentication flow between applications",
      completed: false,
      priority: "high",
      dueDate: "2025-01-20",
      createdBy: "john.doe@company.com",
      createdAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "2",
      title: "Update user permissions documentation",
      description: "Document the new permission model for admin access",
      completed: true,
      priority: "medium",
      dueDate: "2025-01-18",
      createdBy: "john.doe@company.com",
      createdAt: "2025-01-14T14:30:00Z",
    },
    {
      id: "3",
      title: "Test Okta integration endpoints",
      description: "Verify all authentication endpoints are working correctly",
      completed: false,
      priority: "high",
      dueDate: "2025-01-22",
      createdBy: "john.doe@company.com",
      createdAt: "2025-01-15T09:15:00Z",
    },
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const toggleComplete = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  const saveEdit = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, title: editTitle } : todo)))
    setEditingId(null)
    setEditTitle("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No todos yet. Add your first task above!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <Card key={todo.id} className={`transition-all ${todo.completed ? "opacity-75" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Checkbox checked={todo.completed} onCheckedChange={() => toggleComplete(todo.id)} className="mt-1" />

              <div className="flex-1 min-w-0">
                {editingId === todo.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="font-medium"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(todo.id)
                        if (e.key === "Escape") cancelEdit()
                      }}
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => saveEdit(todo.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3
                      className={`font-medium ${
                        todo.completed ? "line-through text-gray-500" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {todo.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{todo.description}</p>

                    <div className="flex items-center space-x-3 mt-3 text-xs text-gray-500">
                      <Badge className={`text-xs ${getPriorityColor(todo.priority)}`}>{todo.priority}</Badge>

                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {formatDate(todo.dueDate)}
                      </div>

                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {todo.createdBy}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {editingId !== todo.id && (
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(todo)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteTodo(todo.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
