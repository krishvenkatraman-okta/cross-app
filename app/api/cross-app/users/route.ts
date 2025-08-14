import { type NextRequest, NextResponse } from "next/server"

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@company.com",
    status: "active",
    groups: ["users", "todo-users", "admin-users"],
    lastLogin: "2025-01-15T10:30:00Z",
    todoCount: 8,
    createdAt: "2024-06-15T09:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@company.com",
    status: "active",
    groups: ["users", "todo-users"],
    lastLogin: "2025-01-15T09:15:00Z",
    todoCount: 12,
    createdAt: "2024-07-20T14:30:00Z",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@company.com",
    status: "inactive",
    groups: ["users"],
    lastLogin: "2025-01-10T14:20:00Z",
    todoCount: 3,
    createdAt: "2024-08-10T11:15:00Z",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice.brown@company.com",
    status: "suspended",
    groups: ["users", "todo-users"],
    lastLogin: "2025-01-08T11:45:00Z",
    todoCount: 0,
    createdAt: "2024-09-05T16:20:00Z",
  },
]

function validateToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, user: null }
  }

  return {
    valid: true,
    user: {
      id: "user_123",
      email: "john.doe@company.com",
      groups: ["users", "todo-users", "admin-users"],
    },
  }
}

function hasPermission(userGroups: string[], requiredPermission: string) {
  const permissionMap: Record<string, string[]> = {
    "users:read": ["admin-users"],
    "users:write": ["admin-users"],
    "users:manage": ["admin-users"],
  }

  const requiredGroups = permissionMap[requiredPermission] || []
  return requiredGroups.some((group) => userGroups.includes(group))
}

export async function GET(request: NextRequest) {
  const { valid, user } = validateToken(request)

  if (!valid || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasPermission(user.groups, "users:read")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const group = searchParams.get("group")

  let filteredUsers = mockUsers

  if (status) {
    filteredUsers = filteredUsers.filter((user) => user.status === status)
  }

  if (group) {
    filteredUsers = filteredUsers.filter((user) => user.groups.includes(group))
  }

  return NextResponse.json({
    users: filteredUsers,
    meta: {
      total: filteredUsers.length,
      requestedBy: user.email,
      timestamp: new Date().toISOString(),
    },
  })
}

export async function PUT(request: NextRequest) {
  const { valid, user } = validateToken(request)

  if (!valid || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasPermission(user.groups, "users:write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { userId, status, groups } = body

  const userIndex = mockUsers.findIndex((u) => u.id === userId)
  if (userIndex === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Update user
  if (status) mockUsers[userIndex].status = status
  if (groups) mockUsers[userIndex].groups = groups

  return NextResponse.json({
    user: mockUsers[userIndex],
    message: "User updated successfully via cross-app access",
  })
}
