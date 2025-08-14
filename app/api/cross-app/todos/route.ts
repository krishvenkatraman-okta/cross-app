import { type NextRequest, NextResponse } from "next/server"

// Mock todo data - in a real app, this would come from a database
const mockTodos = [
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
    createdBy: "jane.smith@company.com",
    createdAt: "2025-01-15T09:15:00Z",
  },
  {
    id: "4",
    title: "Implement cross-app data sharing",
    description: "Enable secure data access between todo and admin applications",
    completed: false,
    priority: "high",
    dueDate: "2025-01-25",
    createdBy: "alice.brown@company.com",
    createdAt: "2025-01-15T11:00:00Z",
  },
]

// Simulate token validation
function validateToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, user: null }
  }

  // In a real app, validate the Okta token here
  // For demo purposes, we'll simulate a valid user
  return {
    valid: true,
    user: {
      id: "user_123",
      email: "john.doe@company.com",
      groups: ["users", "todo-users", "admin-users"],
    },
  }
}

// Check if user has required permissions
function hasPermission(userGroups: string[], requiredPermission: string) {
  const permissionMap: Record<string, string[]> = {
    "todo:read": ["todo-users", "admin-users"],
    "todo:write": ["todo-users", "admin-users"],
    "admin:read": ["admin-users"],
    "admin:write": ["admin-users"],
  }

  const requiredGroups = permissionMap[requiredPermission] || []
  return requiredGroups.some((group) => userGroups.includes(group))
}

export async function GET(request: NextRequest) {
  const { valid, user } = validateToken(request)

  if (!valid || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user has permission to read todos
  if (!hasPermission(user.groups, "todo:read")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const status = searchParams.get("status")

  let filteredTodos = mockTodos

  // Filter by user if specified
  if (userId) {
    filteredTodos = filteredTodos.filter((todo) => todo.createdBy === userId)
  }

  // Filter by status if specified
  if (status) {
    const isCompleted = status === "completed"
    filteredTodos = filteredTodos.filter((todo) => todo.completed === isCompleted)
  }

  return NextResponse.json({
    todos: filteredTodos,
    meta: {
      total: filteredTodos.length,
      requestedBy: user.email,
      timestamp: new Date().toISOString(),
    },
  })
}

export async function POST(request: NextRequest) {
  const { valid, user } = validateToken(request)

  if (!valid || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasPermission(user.groups, "todo:write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, priority, dueDate } = body

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const newTodo = {
    id: Date.now().toString(),
    title,
    description: description || "",
    completed: false,
    priority: priority || "medium",
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    createdBy: user.email,
    createdAt: new Date().toISOString(),
  }

  // In a real app, save to database
  mockTodos.push(newTodo)

  return NextResponse.json({
    todo: newTodo,
    message: "Todo created successfully via cross-app access",
  })
}
